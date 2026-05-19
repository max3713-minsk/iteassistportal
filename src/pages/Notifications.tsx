import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationChannels } from "@/components/notifications/NotificationChannels";
import { NotificationSubscriptions } from "@/components/notifications/NotificationSubscriptions";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { NotificationHistory } from "@/components/notifications/NotificationHistory";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Notifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  useEffect(() => {
    if (!user) return;
    supabase
      .from("notification_log")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["sidebar-unread-notifications", user.id] });
      });
  }, [user, qc]);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Уведомления</h1>
        <p className="text-sm text-muted-foreground">
          Настройте каналы доставки, выберите события и режим уведомлений. Все каналы работают через webhooks.
        </p>
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="channels">Каналы</TabsTrigger>
          <TabsTrigger value="subscriptions">Подписки</TabsTrigger>
          <TabsTrigger value="preferences">Режим</TabsTrigger>
          <TabsTrigger value="history">История</TabsTrigger>
        </TabsList>
        <TabsContent value="channels"><NotificationChannels /></TabsContent>
        <TabsContent value="subscriptions"><NotificationSubscriptions /></TabsContent>
        <TabsContent value="preferences"><NotificationPreferences /></TabsContent>
        <TabsContent value="history"><NotificationHistory /></TabsContent>
      </Tabs>
    </div>
  );
}
