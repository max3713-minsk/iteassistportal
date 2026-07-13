import zabbixProxy from "file:///home/deno/functions/zabbix-proxy/index.ts";
import manageUser from "file:///home/deno/functions/manage-user/index.ts";
import createUser from "file:///home/deno/functions/create-user/index.ts";
import notificationDispatch from "file:///home/deno/functions/notification-dispatch/index.ts";
import seafileUpload from "file:///home/deno/functions/seafile-upload/index.ts";
import seafileUploadTyped from "file:///home/deno/functions/seafile-upload-typed/index.ts";
import protocolExportSeafile from "file:///home/deno/functions/protocol-export-seafile/index.ts";
import gitlabCreateIssue from "file:///home/deno/functions/gitlab-create-issue/index.ts";
import aiIncidentAnalyst from "file:///home/deno/functions/ai-incident-analyst/index.ts";
import mibOidLookup from "file:///home/deno/functions/mib-oid-lookup/index.ts";
import systemPurge from "file:///home/deno/functions/system-purge/index.ts";
import systemRestore from "file:///home/deno/functions/system-restore/index.ts";
import runMigration from "file:///home/deno/functions/run-migration/index.ts";
import holidaysSync from "file:///home/deno/functions/holidays-sync/index.ts";
import ticketSlaReminders from "file:///home/deno/functions/ticket-sla-reminders/index.ts";
import zabbixTemplatesFetch from "file:///home/deno/functions/zabbix-templates-fetch/index.ts";
import zabbixWebhook from "file:///home/deno/functions/zabbix-webhook/index.ts";
import analyzeLog from "file:///home/deno/functions/analyze-log/index.ts";
import ansibleProxy from "file:///home/deno/functions/ansible-proxy/index.ts";
import bootstrapAdmin from "file:///home/deno/functions/bootstrap-admin/index.ts";
import backupStorageCheck from "file:///home/deno/functions/backup-storage-check/index.ts";
import logStorageScan from "file:///home/deno/functions/log-storage-scan/index.ts";

const routes: Record<string, (req: Request) => Promise<Response>> = {
  "zabbix-proxy": zabbixProxy,
  "manage-user": manageUser,
  "create-user": createUser,
  "notification-dispatch": notificationDispatch,
  "seafile-upload": seafileUpload,
  "seafile-upload-typed": seafileUploadTyped,
  "protocol-export-seafile": protocolExportSeafile,
  "gitlab-create-issue": gitlabCreateIssue,
  "ai-incident-analyst": aiIncidentAnalyst,
  "mib-oid-lookup": mibOidLookup,
  "system-purge": systemPurge,
  "system-restore": systemRestore,
  "run-migration": runMigration,
  "holidays-sync": holidaysSync,
  "ticket-sla-reminders": ticketSlaReminders,
  "zabbix-templates-fetch": zabbixTemplatesFetch,
  "zabbix-webhook": zabbixWebhook,
  "analyze-log": analyzeLog,
  "ansible-proxy": ansibleProxy,
  "bootstrap-admin": bootstrapAdmin,
  "backup-storage-check": backupStorageCheck,
  "log-storage-scan": logStorageScan,
};

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const fnName = url.pathname.split("/").filter(Boolean)[0];
  const handler = routes[fnName];
  if (handler) return handler(req);
  return new Response(
    JSON.stringify({ error: "Function not found", path: url.pathname }),
    { status: 404, headers: { "content-type": "application/json" } }
  );
});
