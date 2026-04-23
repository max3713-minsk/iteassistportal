export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alert_thresholds: {
        Row: {
          auto_create_ticket: boolean
          comparison: string
          created_at: string
          created_by: string | null
          critical_value: number | null
          display_name: string | null
          enabled: boolean
          host_id: string | null
          id: string
          item_key: string
          notes: string | null
          updated_at: string
          warning_value: number | null
          zabbix_host_id: string | null
        }
        Insert: {
          auto_create_ticket?: boolean
          comparison?: string
          created_at?: string
          created_by?: string | null
          critical_value?: number | null
          display_name?: string | null
          enabled?: boolean
          host_id?: string | null
          id?: string
          item_key: string
          notes?: string | null
          updated_at?: string
          warning_value?: number | null
          zabbix_host_id?: string | null
        }
        Update: {
          auto_create_ticket?: boolean
          comparison?: string
          created_at?: string
          created_by?: string | null
          critical_value?: number | null
          display_name?: string | null
          enabled?: boolean
          host_id?: string | null
          id?: string
          item_key?: string
          notes?: string | null
          updated_at?: string
          warning_value?: number | null
          zabbix_host_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_thresholds_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "monitored_hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          entity_id: string | null
          id: string
          module: string
          organization: string | null
          target_user_id: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          id?: string
          module: string
          organization?: string | null
          target_user_id?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          id?: string
          module?: string
          organization?: string | null
          target_user_id?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          created_at: string
          host_id: string | null
          host_name: string | null
          id: string
          result: string | null
          script_id: string | null
          script_name: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          host_id?: string | null
          host_name?: string | null
          id?: string
          result?: string | null
          script_id?: string | null
          script_name: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          host_id?: string | null
          host_name?: string | null
          id?: string
          result?: string | null
          script_id?: string | null
          script_name?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          contract_number: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          is_active: boolean
          notes: string | null
          organization_id: string
          scan_name: string | null
          scan_path: string | null
          start_date: string
          title: string | null
          updated_at: string
        }
        Insert: {
          contract_number: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id: string
          scan_name?: string | null
          scan_path?: string | null
          start_date: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          contract_number?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id?: string
          scan_name?: string | null
          scan_path?: string | null
          start_date?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          doc_category: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          organization: string
          organization_id: string | null
          site_id: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          doc_category?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          organization: string
          organization_id?: string | null
          site_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          doc_category?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          organization?: string
          organization_id?: string | null
          site_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          model: string | null
          name: string
          organization_id: string | null
          os_info: string | null
          quantity: number | null
          serial_number: string | null
          site_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          model?: string | null
          name: string
          organization_id?: string | null
          os_info?: string | null
          quantity?: number | null
          serial_number?: string | null
          site_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          model?: string | null
          name?: string
          organization_id?: string | null
          os_info?: string | null
          quantity?: number | null
          serial_number?: string | null
          site_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "equipment_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_categories: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      item_aliases: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_name: string
          host_id: string | null
          id: string
          item_key: string
          updated_at: string
          zabbix_host_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          host_id?: string | null
          id?: string
          item_key: string
          updated_at?: string
          zabbix_host_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          host_id?: string | null
          id?: string
          item_key?: string
          updated_at?: string
          zabbix_host_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_aliases_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "monitored_hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_protocols: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          contract_id: string | null
          created_at: string
          created_by: string | null
          frequency: Database["public"]["Enums"]["maintenance_frequency"]
          id: string
          notes: string | null
          period_end: string
          period_start: string
          site_id: string
          status: Database["public"]["Enums"]["protocol_status"]
          ticket_id: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          frequency: Database["public"]["Enums"]["maintenance_frequency"]
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          site_id: string
          status?: Database["public"]["Enums"]["protocol_status"]
          ticket_id?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          frequency?: Database["public"]["Enums"]["maintenance_frequency"]
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          site_id?: string
          status?: Database["public"]["Enums"]["protocol_status"]
          ticket_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_protocols_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_protocols_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_protocols_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          assigned_to: string | null
          created_at: string
          equipment_id: string
          id: string
          last_completed_date: string | null
          next_due_date: string
          task_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          equipment_id: string
          id?: string
          last_completed_date?: string | null
          next_due_date: string
          task_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          equipment_id?: string
          id?: string
          last_completed_date?: string | null
          next_due_date?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedules_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_tasks: {
        Row: {
          automation_script: string | null
          category_id: string | null
          created_at: string
          description: string | null
          frequency: Database["public"]["Enums"]["maintenance_frequency"]
          id: string
          is_automatable: boolean | null
          title: string
        }
        Insert: {
          automation_script?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          frequency: Database["public"]["Enums"]["maintenance_frequency"]
          id?: string
          is_automatable?: boolean | null
          title: string
        }
        Update: {
          automation_script?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["maintenance_frequency"]
          id?: string
          is_automatable?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "equipment_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_translations: {
        Row: {
          category: string | null
          created_at: string
          description_ru: string | null
          display_name_ru: string
          id: string
          key_pattern: string
          match_type: string
          priority: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description_ru?: string | null
          display_name_ru: string
          id?: string
          key_pattern: string
          match_type?: string
          priority?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description_ru?: string | null
          display_name_ru?: string
          id?: string
          key_pattern?: string
          match_type?: string
          priority?: number
          updated_at?: string
        }
        Relationships: []
      }
      monitored_hosts: {
        Row: {
          created_at: string
          credentials_login: string | null
          credentials_password: string | null
          device_type: Database["public"]["Enums"]["device_type"]
          enabled: boolean
          host_group: string | null
          id: string
          ip_address: string
          name: string
          notes: string | null
          organization_id: string | null
          port: number | null
          protocol: Database["public"]["Enums"]["monitoring_protocol"]
          protocols_config: Json | null
          site_id: string | null
          snmp_community: string | null
          templates: Json | null
          updated_at: string
          visible_name: string | null
          zabbix_connection_id: string | null
          zabbix_host_id: string | null
        }
        Insert: {
          created_at?: string
          credentials_login?: string | null
          credentials_password?: string | null
          device_type?: Database["public"]["Enums"]["device_type"]
          enabled?: boolean
          host_group?: string | null
          id?: string
          ip_address: string
          name: string
          notes?: string | null
          organization_id?: string | null
          port?: number | null
          protocol?: Database["public"]["Enums"]["monitoring_protocol"]
          protocols_config?: Json | null
          site_id?: string | null
          snmp_community?: string | null
          templates?: Json | null
          updated_at?: string
          visible_name?: string | null
          zabbix_connection_id?: string | null
          zabbix_host_id?: string | null
        }
        Update: {
          created_at?: string
          credentials_login?: string | null
          credentials_password?: string | null
          device_type?: Database["public"]["Enums"]["device_type"]
          enabled?: boolean
          host_group?: string | null
          id?: string
          ip_address?: string
          name?: string
          notes?: string | null
          organization_id?: string | null
          port?: number | null
          protocol?: Database["public"]["Enums"]["monitoring_protocol"]
          protocols_config?: Json | null
          site_id?: string | null
          snmp_community?: string | null
          templates?: Json | null
          updated_at?: string
          visible_name?: string | null
          zabbix_connection_id?: string | null
          zabbix_host_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monitored_hosts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitored_hosts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitored_hosts_zabbix_connection_id_fkey"
            columns: ["zabbix_connection_id"]
            isOneToOne: false
            referencedRelation: "zabbix_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_host_links: {
        Row: {
          auto_matched: boolean
          created_at: string
          created_by: string | null
          equipment_id: string
          host_name: string
          id: string
          updated_at: string
          zabbix_host_id: string
        }
        Insert: {
          auto_matched?: boolean
          created_at?: string
          created_by?: string | null
          equipment_id: string
          host_name: string
          id?: string
          updated_at?: string
          zabbix_host_id: string
        }
        Update: {
          auto_matched?: boolean
          created_at?: string
          created_by?: string | null
          equipment_id?: string
          host_name?: string
          id?: string
          updated_at?: string
          zabbix_host_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_host_links_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: true
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_channels: {
        Row: {
          channel_type: string
          config: Json
          created_at: string
          enabled: boolean
          id: string
          last_test_at: string | null
          last_test_error: string | null
          last_test_status: string | null
          name: string
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          channel_type: string
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          last_test_at?: string | null
          last_test_error?: string | null
          last_test_status?: string | null
          name: string
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          channel_type?: string
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          last_test_at?: string | null
          last_test_error?: string | null
          last_test_status?: string | null
          name?: string
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          attempts: number
          body: string | null
          channel_id: string | null
          channel_type: string
          created_at: string
          error: string | null
          event_type: string
          http_status: number | null
          id: string
          payload: Json | null
          priority: string | null
          sent_at: string | null
          status: string
          title: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          body?: string | null
          channel_id?: string | null
          channel_type: string
          created_at?: string
          error?: string | null
          event_type: string
          http_status?: number | null
          id?: string
          payload?: Json | null
          priority?: string | null
          sent_at?: string | null
          status?: string
          title?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          body?: string | null
          channel_id?: string | null
          channel_type?: string
          created_at?: string
          error?: string | null
          event_type?: string
          http_status?: number | null
          id?: string
          payload?: Json | null
          priority?: string | null
          sent_at?: string | null
          status?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          delivery_mode: string
          digest_schedule: string
          dnd_enabled: boolean
          quiet_bypass_critical: boolean
          quiet_days: Json
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_mode?: string
          digest_schedule?: string
          dnd_enabled?: boolean
          quiet_bypass_critical?: boolean
          quiet_days?: Json
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_mode?: string
          digest_schedule?: string
          dnd_enabled?: boolean
          quiet_bypass_critical?: boolean
          quiet_days?: Json
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          attempts: number
          body: string | null
          created_at: string
          event_type: string
          id: string
          last_error: string | null
          payload: Json
          priority: string | null
          scheduled_for: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          body?: string | null
          created_at?: string
          event_type: string
          id?: string
          last_error?: string | null
          payload?: Json
          priority?: string | null
          scheduled_for?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          body?: string | null
          created_at?: string
          event_type?: string
          id?: string
          last_error?: string | null
          payload?: Json
          priority?: string | null
          scheduled_for?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_subscriptions: {
        Row: {
          channel_ids: Json
          created_at: string
          enabled: boolean
          event_type: string
          filters: Json
          id: string
          min_priority: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_ids?: Json
          created_at?: string
          enabled?: boolean
          event_type: string
          filters?: Json
          id?: string
          min_priority?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_ids?: Json
          created_at?: string
          enabled?: boolean
          event_type?: string
          filters?: Json
          id?: string
          min_priority?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          inn: string | null
          is_active: boolean
          name: string
          notes: string | null
          short_name: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          inn?: string | null
          is_active?: boolean
          name: string
          notes?: string | null
          short_name?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          inn?: string | null
          is_active?: boolean
          name?: string
          notes?: string | null
          short_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          organization: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          organization?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          organization?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      protocol_items: {
        Row: {
          auto_result: Json | null
          completed_at: string | null
          completed_by: string | null
          equipment_id: string
          id: string
          notes: string | null
          protocol_id: string
          result: string | null
          schedule_id: string | null
          status: string | null
          task_id: string
        }
        Insert: {
          auto_result?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          equipment_id: string
          id?: string
          notes?: string | null
          protocol_id: string
          result?: string | null
          schedule_id?: string | null
          status?: string | null
          task_id: string
        }
        Update: {
          auto_result?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          equipment_id?: string
          id?: string
          notes?: string | null
          protocol_id?: string
          result?: string | null
          schedule_id?: string | null
          status?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_items_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "maintenance_protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_items_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "maintenance_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_graphs: {
        Row: {
          aggregation: string | null
          chart_type: string
          config: Json | null
          created_at: string
          description: string | null
          host_ids: Json
          id: string
          is_shared: boolean
          is_template: boolean
          item_keys: Json
          name: string
          time_range: string
          tz_requirement_codes: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aggregation?: string | null
          chart_type?: string
          config?: Json | null
          created_at?: string
          description?: string | null
          host_ids?: Json
          id?: string
          is_shared?: boolean
          is_template?: boolean
          item_keys?: Json
          name: string
          time_range?: string
          tz_requirement_codes?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aggregation?: string | null
          chart_type?: string
          config?: Json | null
          created_at?: string
          description?: string | null
          host_ids?: Json
          id?: string
          is_shared?: boolean
          is_template?: boolean
          item_keys?: Json
          name?: string
          time_range?: string
          tz_requirement_codes?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          ticket_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_status_history: {
        Row: {
          changed_by: string
          changed_by_name: string | null
          comment: string | null
          created_at: string
          id: string
          new_status: string
          old_status: string | null
          ticket_id: string
        }
        Insert: {
          changed_by: string
          changed_by_name?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          new_status: string
          old_status?: string | null
          ticket_id: string
        }
        Update: {
          changed_by?: string
          changed_by_name?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          new_status?: string
          old_status?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_status_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          equipment_id: string | null
          first_response_at: string | null
          id: string
          incident_category: string | null
          organization_id: string | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          product_code: string | null
          request_type: string | null
          resolved_at: string | null
          site_id: string | null
          sla_deadline: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subcategory: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          equipment_id?: string | null
          first_response_at?: string | null
          id?: string
          incident_category?: string | null
          organization_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          product_code?: string | null
          request_type?: string | null
          resolved_at?: string | null
          site_id?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subcategory?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          equipment_id?: string | null
          first_response_at?: string | null
          id?: string
          incident_category?: string | null
          organization_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          product_code?: string | null
          request_type?: string | null
          resolved_at?: string | null
          site_id?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subcategory?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      tz_coverage: {
        Row: {
          created_at: string
          host_id: string | null
          id: string
          notes: string | null
          related_items: Json | null
          requirement_id: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          host_id?: string | null
          id?: string
          notes?: string | null
          related_items?: Json | null
          requirement_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          host_id?: string | null
          id?: string
          notes?: string | null
          related_items?: Json | null
          requirement_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tz_coverage_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "monitored_hosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tz_coverage_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "tz_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      tz_requirements: {
        Row: {
          category: string | null
          check_type: string | null
          code: string
          created_at: string
          id: string
          notes: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          check_type?: string | null
          code: string
          created_at?: string
          id?: string
          notes?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          check_type?: string | null
          code?: string
          created_at?: string
          id?: string
          notes?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_dashboard_widgets: {
        Row: {
          config: Json
          created_at: string
          id: string
          position: number
          title: string
          updated_at: string
          user_id: string
          widget_type: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          position?: number
          title: string
          updated_at?: string
          user_id: string
          widget_type: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          position?: number
          title?: string
          updated_at?: string
          user_id?: string
          widget_type?: string
        }
        Relationships: []
      }
      user_favorite_metrics: {
        Row: {
          created_at: string
          host_name: string
          id: string
          item_key: string
          item_name: string
          itemid: string
          position: number
          units: string | null
          user_id: string
          zabbix_host_id: string
        }
        Insert: {
          created_at?: string
          host_name: string
          id?: string
          item_key: string
          item_name: string
          itemid: string
          position?: number
          units?: string | null
          user_id: string
          zabbix_host_id: string
        }
        Update: {
          created_at?: string
          host_name?: string
          id?: string
          item_key?: string
          item_name?: string
          itemid?: string
          position?: number
          units?: string | null
          user_id?: string
          zabbix_host_id?: string
        }
        Relationships: []
      }
      user_metric_preferences: {
        Row: {
          created_at: string
          display_language: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_language?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_language?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_module_permissions: {
        Row: {
          created_at: string
          id: string
          module_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      zabbix_connections: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          organization_id: string
          updated_at: string
          updated_by: string | null
          vpn_info: string | null
          zabbix_password: string
          zabbix_url: string
          zabbix_user: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          organization_id: string
          updated_at?: string
          updated_by?: string | null
          vpn_info?: string | null
          zabbix_password: string
          zabbix_url: string
          zabbix_user: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
          updated_by?: string | null
          vpn_info?: string | null
          zabbix_password?: string
          zabbix_url?: string
          zabbix_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "zabbix_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      zabbix_settings: {
        Row: {
          id: string
          is_active: boolean
          updated_at: string
          updated_by: string | null
          vpn_info: string | null
          zabbix_password: string
          zabbix_url: string
          zabbix_user: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          updated_at?: string
          updated_by?: string | null
          vpn_info?: string | null
          zabbix_password?: string
          zabbix_url?: string
          zabbix_user?: string
        }
        Update: {
          id?: string
          is_active?: boolean
          updated_at?: string
          updated_by?: string | null
          vpn_info?: string | null
          zabbix_password?: string
          zabbix_url?: string
          zabbix_user?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "engineer" | "customer"
      device_type:
        | "server"
        | "bmc"
        | "switch"
        | "storage"
        | "firewall"
        | "ups"
        | "router"
        | "other"
      maintenance_frequency:
        | "daily"
        | "weekly"
        | "monthly"
        | "quarterly"
        | "semi_annual"
        | "on_request"
      monitoring_protocol: "SNMP" | "IPMI" | "SSH" | "HTTP" | "HTTPS" | "Agent"
      protocol_status: "pending" | "in_progress" | "completed" | "overdue"
      ticket_priority: "P1" | "P2" | "P3" | "P4"
      ticket_status:
        | "open"
        | "in_progress"
        | "waiting"
        | "overdue"
        | "resolved"
        | "closed"
        | "assigned"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "engineer", "customer"],
      device_type: [
        "server",
        "bmc",
        "switch",
        "storage",
        "firewall",
        "ups",
        "router",
        "other",
      ],
      maintenance_frequency: [
        "daily",
        "weekly",
        "monthly",
        "quarterly",
        "semi_annual",
        "on_request",
      ],
      monitoring_protocol: ["SNMP", "IPMI", "SSH", "HTTP", "HTTPS", "Agent"],
      protocol_status: ["pending", "in_progress", "completed", "overdue"],
      ticket_priority: ["P1", "P2", "P3", "P4"],
      ticket_status: [
        "open",
        "in_progress",
        "waiting",
        "overdue",
        "resolved",
        "closed",
        "assigned",
        "cancelled",
      ],
    },
  },
} as const
