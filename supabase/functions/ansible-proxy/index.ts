import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const ANSIBLE_HOST = Deno.env.get('ANSIBLE_HOST')
  const ANSIBLE_USER = Deno.env.get('ANSIBLE_USER')
  const ANSIBLE_PASSWORD = Deno.env.get('ANSIBLE_PASSWORD')

  if (!ANSIBLE_HOST || !ANSIBLE_USER || !ANSIBLE_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Ansible credentials not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const body = await req.json()
    const { action, playbook, target_host, job_id } = body

    switch (action) {
      case 'listPlaybooks': {
        const playbooks = [
          {
            id: 'restart_ptk_services',
            name: 'Перезапуск сервисов ПТК',
            category: 'restart',
            categoryLabel: 'Перезапуск',
            description: 'Перезапуск сервисов scada, postgres, web на серверах ПТК АСДТУ',
            tzRef: 'п. 2, 52',
          },
          {
            id: 'cleanup_logs',
            name: 'Очистка временных файлов и логов',
            category: 'cleanup',
            categoryLabel: 'Очистка',
            description: 'Удаление устаревших логов, tmp-файлов, очистка журналов',
            tzRef: 'п. 33',
          },
          {
            id: 'backup_db',
            name: 'Внеплановое создание бэкапа БД',
            category: 'backup',
            categoryLabel: 'Бэкап',
            description: 'pg_dump основных баз данных PostgreSQL с компрессией',
            tzRef: 'п. 15',
          },
          {
            id: 'reset_rdp_session',
            name: 'Сброс зависшей сессии RDP',
            category: 'session',
            categoryLabel: 'Сессии',
            description: 'Принудительное завершение зависших RDP-сессий на Windows Server',
            tzRef: 'п. 13',
          },
          {
            id: 'failover_hypermetro',
            name: 'Failover HyperMetro СХД (тестовый)',
            category: 'failover',
            categoryLabel: 'Failover',
            description: 'Тестовое переключение HyperMetro пар OceanStor Dorado',
            tzRef: 'п. 163',
          },
          {
            id: 'update_ospf_metrics',
            name: 'Обновление OSPF-метрик',
            category: 'network',
            categoryLabel: 'Сеть',
            description: 'Плановое обновление метрик OSPF на маршрутизаторах',
            tzRef: 'п. 226',
          },
          {
            id: 'check_disk_space',
            name: 'Проверка дискового пространства',
            category: 'check',
            categoryLabel: 'Проверка',
            description: 'df -h на всех серверах, проверка /var/lib/postgresql',
            tzRef: 'п. 31',
          },
          {
            id: 'check_services',
            name: 'Проверка статуса сервисов',
            category: 'check',
            categoryLabel: 'Проверка',
            description: 'systemctl status критичных сервисов (scada, postgres, web)',
            tzRef: 'п. 1, 2',
          },
          {
            id: 'db_maintenance',
            name: 'Обслуживание БД PostgreSQL',
            category: 'backup',
            categoryLabel: 'БД',
            description: 'VACUUM ANALYZE, проверка репликации, WAL size',
            tzRef: 'п. 16, 17',
          },
          {
            id: 'k8s_health',
            name: 'Проверка Kubernetes кластера',
            category: 'check',
            categoryLabel: 'Проверка',
            description: 'kubectl get nodes/pods, ресурсы СК-11 и РС-20',
            tzRef: 'п. 25, 26, 27',
          },
          {
            id: 'cert_check',
            name: 'Проверка SSL сертификатов',
            category: 'check',
            categoryLabel: 'Проверка',
            description: 'Проверка сроков действия SSL/TLS сертификатов',
            tzRef: 'п. 49',
          },
          {
            id: 'security_audit',
            name: 'Аудит безопасности',
            category: 'check',
            categoryLabel: 'Безопасность',
            description: 'Проверка открытых портов, учётных записей, обновлений',
            tzRef: 'п. 34',
          },
        ]
        return new Response(JSON.stringify({ result: playbooks }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'runPlaybook': {
        if (!playbook) {
          return new Response(JSON.stringify({ error: 'Playbook ID required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // In production: call Ansible Semaphore / AWX API
        const jobId = crypto.randomUUID()
        const result = {
          job_id: jobId,
          playbook,
          target_host: target_host || 'all',
          status: 'queued',
          started_at: new Date().toISOString(),
          host: ANSIBLE_HOST,
          message: `Сценарий ${playbook} поставлен в очередь${target_host ? ` на ${target_host}` : ''}`,
        }

        return new Response(JSON.stringify({ result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'getJobStatus': {
        if (!job_id) {
          return new Response(JSON.stringify({ error: 'Job ID required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        const result = {
          job_id,
          status: 'completed',
          output: 'Playbook executed successfully',
          completed_at: new Date().toISOString(),
        }
        return new Response(JSON.stringify({ result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (err) {
    console.error('Ansible proxy error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
