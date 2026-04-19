import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationChannels } from "@/components/notifications/NotificationChannels";
import { NotificationSubscriptions } from "@/components/notifications/NotificationSubscriptions";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { NotificationHistory } from "@/components/notifications/NotificationHistory";

export default function Notifications() {
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
