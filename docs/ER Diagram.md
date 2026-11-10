
erDiagram

    USERS {
        int user_id PK
        varchar full_name
        varchar email UK
        varchar phone
        varchar password_hash
        varchar role
        boolean is_active
        timestamp created_at
    }

    SERVICES {
        int service_id PK
        varchar service_name
        text description
        int average_service_time
        boolean is_active
    }

    STAFF {
        int staff_id PK
        int user_id FK
        int assigned_service_id FK
        varchar availability_status
    }

    SERVICE_SCHEDULES {
        int schedule_id PK
        int service_id FK
        int staff_id FK
        date available_date
        time start_time
        time end_time
        int slot_capacity
        boolean is_available
    }

    APPOINTMENTS {
        int appointment_id PK
        int user_id FK
        int service_id FK
        int staff_id FK
        int schedule_id FK
        date appointment_date
        time time_slot
        varchar appointment_status
        boolean priority
        timestamp created_at
    }

    QUEUE {
        int queue_id PK
        int service_id FK
        date queue_date
        int current_token
        int last_generated_token
        timestamp updated_at
    }

    QUEUE_TOKENS {
        int token_id PK
        int appointment_id FK
        int queue_id FK
        int token_number
        varchar queue_status
        boolean priority
        timestamp created_at
        timestamp called_at
        timestamp completed_at
    }

    FEEDBACK {
        int feedback_id PK
        int user_id FK
        int appointment_id FK
        int service_id FK
        int rating
        text comments
        timestamp created_at
    }

    NOTIFICATIONS {
        int notification_id PK
        int user_id FK
        int appointment_id FK
        varchar notification_type
        text message
        varchar delivery_status
        timestamp created_at
    }

    APPOINTMENT_HISTORY {
        int history_id PK
        int appointment_id FK
        varchar previous_status
        varchar new_status
        int changed_by FK
        timestamp changed_at
    }

    USERS ||--o{ APPOINTMENTS : books
    USERS ||--o| STAFF : has_staff_profile
    SERVICES ||--o{ STAFF : assigned_to
    SERVICES ||--o{ SERVICE_SCHEDULES : provides
    STAFF ||--o{ SERVICE_SCHEDULES : manages
    USERS ||--o{ SERVICE_SCHEDULES : creates
    SERVICES ||--o{ APPOINTMENTS : receives
    STAFF o|--o{ APPOINTMENTS : handles
    SERVICE_SCHEDULES ||--o{ APPOINTMENTS : reserves
    SERVICES ||--o{ QUEUE : maintains
    QUEUE ||--o{ QUEUE_TOKENS : contains
    APPOINTMENTS ||--o| QUEUE_TOKENS : generates
    USERS ||--o{ FEEDBACK : submits
    APPOINTMENTS ||--o| FEEDBACK : receives
    SERVICES ||--o{ FEEDBACK : receives
    USERS ||--o{ NOTIFICATIONS : receives
    APPOINTMENTS o|--o{ NOTIFICATIONS : generates
    APPOINTMENTS ||--o{ APPOINTMENT_HISTORY : tracks
    USERS o|--o{ APPOINTMENT_HISTORY : changes
