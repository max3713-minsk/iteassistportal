import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";

/**
 * Хук переводов метрик Zabbix.
 *
 * Источники (по приоритету):
 * 1. item_aliases (ручной алиас, заданный админом для конкретного хоста)
 * 2. metric_translations (глобальный автословарь, exact и LIKE)
 * 3. Оригинальное имя из Zabbix (item.name)
 *
 * Учитывает выбор пользователя: оригинал/перевод.
 * Возвращает функцию translate(item) → строка для отображения.
 */

interface MetricTranslation {
  id: string;
  key_pattern: string;
  match_type: "exact" | "like" | "regex";
  display_name_ru: string;
  description_ru: string | null;
  category: string | null;
  priority: number;
}

interface ItemAlias {
  id: string;
  item_key: string;
  display_name: string;
  description: string | null;
  category: string | null;
  zabbix_host_id: string | null;
}

export interface TranslatableItem {
  key_?: string | null;
  name?: string | null;
}

function likeToRegex(pattern: string): RegExp {
  // Экранируем regex-метасимволы кроме % и _
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  // % → .*, _ → .
  const re = escaped.replace(/%/g, ".*").replace(/_/g, ".");
  return new RegExp(`^${re}$`, "i");
}

export function useMetricTranslations(zabbixHostId?: string | null) {
  const { user } = useAuth();

  // Глобальный словарь — кэшируется надолго
  const { data: translations = [] } = useQuery({
    queryKey: ["metric-translations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("metric_translations")
        .select("*")
        .order("priority", { ascending: true });
      return (data || []) as MetricTranslation[];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Алиасы для хоста (если указан)
  const { data: aliases = [] } = useQuery({
    queryKey: ["item-aliases-by-zhost", zabbixHostId],
    queryFn: async () => {
      if (!zabbixHostId) return [];
      const { data } = await supabase
        .from("item_aliases")
        .select("*")
        .eq("zabbix_host_id", zabbixHostId);
      return (data || []) as ItemAlias[];
    },
    enabled: !!zabbixHostId,
    staleTime: 60 * 1000,
  });

  // Настройка пользователя
  const { data: prefs } = useQuery({
    queryKey: ["user-metric-prefs", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_metric_preferences")
        .select("display_language")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const language = (prefs?.display_language ?? "translated") as "original" | "translated";

  const aliasMap = useMemo(() => {
    const m = new Map<string, ItemAlias>();
    aliases.forEach((a) => m.set(a.item_key, a));
    return m;
  }, [aliases]);

  // Предкомпилированные regex для LIKE-шаблонов
  const compiled = useMemo(() => {
    return translations.map((t) => ({
      ...t,
      regex: t.match_type === "like" || t.match_type === "regex"
        ? likeToRegex(t.key_pattern)
        : null,
    }));
  }, [translations]);

  const exactMap = useMemo(() => {
    const m = new Map<string, MetricTranslation>();
    translations
      .filter((t) => t.match_type === "exact")
      .forEach((t) => m.set(t.key_pattern, t));
    return m;
  }, [translations]);

  const translate = (item: TranslatableItem): string => {
    const key = item.key_ || "";
    const original = item.name || key || "—";

    if (language === "original") return original;

    // 1. Ручной алиас
    const alias = aliasMap.get(key);
    if (alias?.display_name) return alias.display_name;

    // 2. Точное совпадение
    const exact = exactMap.get(key);
    if (exact) return exact.display_name_ru;

    // 3. LIKE-совпадение (по приоритету, первое подходящее)
    for (const t of compiled) {
      if (t.regex && t.regex.test(key)) return t.display_name_ru;
    }

    // 4. Fallback
    return original;
  };

  return {
    translate,
    language,
    isOriginal: language === "original",
    aliasMap,
    translationsCount: translations.length,
  };
}

/** Утилита: переключить язык пользователя */
export async function setUserMetricLanguage(userId: string, lang: "original" | "translated") {
  const { data: existing } = await supabase
    .from("user_metric_preferences")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("user_metric_preferences")
      .update({ display_language: lang })
      .eq("user_id", userId);
  } else {
    await supabase
      .from("user_metric_preferences")
      .insert({ user_id: userId, display_language: lang });
  }
}