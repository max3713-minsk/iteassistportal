-- 1) Глобальный словарь переводов метрик (Zabbix item_key → русское название)
-- Используется как автоперевод: совпадение по точному ключу или по шаблону (LIKE).
CREATE TABLE public.metric_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Шаблон ключа Zabbix. Может быть точным ('system.cpu.util') 
  -- или LIKE-шаблоном ('vfs.fs.size[%,pfree]')
  key_pattern TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'exact', -- 'exact' | 'like' | 'regex'
  display_name_ru TEXT NOT NULL,
  description_ru TEXT,
  category TEXT,
  priority INTEGER NOT NULL DEFAULT 100, -- меньше = раньше применяется
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_metric_translations_pattern ON public.metric_translations(key_pattern);
CREATE INDEX idx_metric_translations_priority ON public.metric_translations(priority);

ALTER TABLE public.metric_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view translations"
  ON public.metric_translations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage translations"
  ON public.metric_translations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Engineers manage translations"
  ON public.metric_translations FOR ALL
  USING (has_role(auth.uid(), 'engineer'::app_role));

CREATE TRIGGER trg_metric_translations_updated
  BEFORE UPDATE ON public.metric_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Персональные настройки пользователя для метрик
-- Включает: язык (оригинал/перевод) + список избранных метрик для дашборда
CREATE TABLE public.user_metric_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  -- 'original' = английские оригинальные имена Zabbix
  -- 'translated' = русские названия (автословарь + алиасы)
  display_language TEXT NOT NULL DEFAULT 'translated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_metric_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own metric prefs"
  ON public.user_metric_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_user_metric_prefs_updated
  BEFORE UPDATE ON public.user_metric_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Избранные метрики пользователя (звёздочки) для отображения на дашборде
CREATE TABLE public.user_favorite_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  zabbix_host_id TEXT NOT NULL,
  host_name TEXT NOT NULL,
  itemid TEXT NOT NULL,
  item_key TEXT NOT NULL,
  item_name TEXT NOT NULL,
  units TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, itemid)
);

CREATE INDEX idx_user_favorite_metrics_user ON public.user_favorite_metrics(user_id, position);

ALTER TABLE public.user_favorite_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorite metrics"
  ON public.user_favorite_metrics FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4) Засеять базовый словарь переводов для типовых Zabbix ключей
INSERT INTO public.metric_translations (key_pattern, match_type, display_name_ru, category, priority) VALUES
  -- CPU
  ('system.cpu.util', 'exact', 'Загрузка процессора', 'Процессор', 10),
  ('system.cpu.load[all,avg1]', 'exact', 'Средняя нагрузка CPU (1 мин)', 'Процессор', 10),
  ('system.cpu.load[all,avg5]', 'exact', 'Средняя нагрузка CPU (5 мин)', 'Процессор', 10),
  ('system.cpu.load[all,avg15]', 'exact', 'Средняя нагрузка CPU (15 мин)', 'Процессор', 10),
  ('system.cpu.num', 'exact', 'Число ядер процессора', 'Процессор', 10),
  ('system.cpu.intr', 'exact', 'Прерывания процессора', 'Процессор', 10),
  ('system.cpu.switches', 'exact', 'Переключения контекста CPU', 'Процессор', 10),
  -- Memory
  ('vm.memory.size[available]', 'exact', 'Доступная оперативная память', 'Память', 10),
  ('vm.memory.size[total]', 'exact', 'Всего оперативной памяти', 'Память', 10),
  ('vm.memory.size[used]', 'exact', 'Используемая оперативная память', 'Память', 10),
  ('vm.memory.size[free]', 'exact', 'Свободная оперативная память', 'Память', 10),
  ('vm.memory.utilization', 'exact', 'Использование памяти, %', 'Память', 10),
  ('system.swap.size[,free]', 'exact', 'Свободно в файле подкачки', 'Память', 10),
  ('system.swap.size[,pfree]', 'exact', 'Свободно в файле подкачки, %', 'Память', 10),
  -- Disk / FS
  ('vfs.fs.size[%,total]', 'like', 'Объём файловой системы', 'Диски', 20),
  ('vfs.fs.size[%,used]', 'like', 'Занято на диске', 'Диски', 20),
  ('vfs.fs.size[%,free]', 'like', 'Свободно на диске', 'Диски', 20),
  ('vfs.fs.size[%,pfree]', 'like', 'Свободно на диске, %', 'Диски', 20),
  ('vfs.fs.size[%,pused]', 'like', 'Занято на диске, %', 'Диски', 20),
  ('vfs.fs.inode[%,pfree]', 'like', 'Свободно inode, %', 'Диски', 20),
  ('vfs.dev.read.rate[%]', 'like', 'Скорость чтения с диска', 'Диски', 20),
  ('vfs.dev.write.rate[%]', 'like', 'Скорость записи на диск', 'Диски', 20),
  ('vfs.dev.read.await[%]', 'like', 'Время ожидания чтения', 'Диски', 20),
  ('vfs.dev.write.await[%]', 'like', 'Время ожидания записи', 'Диски', 20),
  ('vfs.dev.util[%]', 'like', 'Утилизация диска, %', 'Диски', 20),
  -- VMware-specific
  ('vmware.vm.vfs.dev.read[%]', 'like', 'Скорость чтения с диска (ВМ)', 'Диски', 15),
  ('vmware.vm.vfs.dev.write[%]', 'like', 'Скорость записи на диск (ВМ)', 'Диски', 15),
  ('vmware.vm.storage.readoio[%]', 'like', 'Невыполненные запросы чтения', 'Диски', 15),
  ('vmware.vm.storage.writeoio[%]', 'like', 'Невыполненные запросы записи', 'Диски', 15),
  ('vmware.vm.cpu.usage[%]', 'like', 'Использование CPU (ВМ)', 'Процессор', 15),
  ('vmware.vm.memory.size[%]', 'like', 'Память (ВМ)', 'Память', 15),
  -- Network
  ('net.if.in[%]', 'like', 'Входящий трафик', 'Сеть', 20),
  ('net.if.out[%]', 'like', 'Исходящий трафик', 'Сеть', 20),
  ('net.if.in.errors[%]', 'like', 'Ошибки приёма', 'Сеть', 20),
  ('net.if.out.errors[%]', 'like', 'Ошибки передачи', 'Сеть', 20),
  ('net.if.in.discards[%]', 'like', 'Отброшено пакетов на приём', 'Сеть', 20),
  ('net.if.out.discards[%]', 'like', 'Отброшено пакетов на передачу', 'Сеть', 20),
  ('net.if.status[%]', 'like', 'Статус интерфейса', 'Сеть', 20),
  ('net.tcp.service[%]', 'like', 'Доступность TCP-сервиса', 'Сеть', 20),
  ('icmpping', 'exact', 'Доступность по ICMP (пинг)', 'Сеть', 10),
  ('icmppingloss', 'exact', 'Потери ICMP-пакетов, %', 'Сеть', 10),
  ('icmppingsec', 'exact', 'Время отклика ICMP', 'Сеть', 10),
  ('agent.ping', 'exact', 'Доступность Zabbix-агента', 'Сеть', 10),
  -- System
  ('system.uptime', 'exact', 'Время работы системы', 'Состояние компонентов', 10),
  ('system.uname', 'exact', 'Информация о системе', 'Состояние компонентов', 10),
  ('system.hostname', 'exact', 'Имя хоста', 'Состояние компонентов', 10),
  ('system.localtime', 'exact', 'Локальное время системы', 'Состояние компонентов', 10),
  ('system.users.num', 'exact', 'Число активных пользователей', 'Состояние компонентов', 10),
  ('proc.num[]', 'exact', 'Количество процессов', 'Состояние компонентов', 10),
  -- Sensors / IPMI
  ('sensor[%temp%]', 'like', 'Температурный датчик', 'Температура', 30),
  ('sensor[%fan%]', 'like', 'Вентилятор', 'Вентиляторы', 30),
  ('sensor[%volt%]', 'like', 'Датчик напряжения', 'Напряжения', 30),
  ('ipmi.sensor[%]', 'like', 'IPMI-датчик', 'Состояние компонентов', 30);
