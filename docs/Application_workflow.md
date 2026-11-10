
flowchart TD

    A([Start]) --> B[Open QueueLess Application]

    B --> C{Already Registered?}

    C -->|No| D[User Registration]
    D --> E[Validate Registration]
    E --> F[Save User Details]

    C -->|Yes| G[Login]
    F --> G

    G --> H{Verify Credentials}

    H -->|Invalid| I[Display Error Message]
    I --> G

    H -->|Valid| J{Identify User Role}

    J -->|User| U1[User Dashboard]
    J -->|Staff| S1[Staff Dashboard]
    J -->|Admin| AD1[Admin Dashboard]

    subgraph USER["USER WORKFLOW"]
        U1 --> U2[View Available Services]
        U2 --> U3[Select Service]
        U3 --> U4[Choose Date and Time Slot]
        U4 --> U5{Slot Available?}
        U5 -->|No| U6[Select Another Slot]
        U6 --> U4
        U5 -->|Yes| U7[Confirm Appointment]
        U7 --> U8[Generate Digital Token]
        U8 --> U9[Booking Confirmation]
        U9 --> U10[Track Live Queue]
        U10 --> U11[Receive Turn Notification]
        U11 --> U12[Receive Service]
        U12 --> U13[Submit Feedback and Rating]
        U13 --> U14[View Appointment History]
    end

    subgraph STAFF["STAFF WORKFLOW"]
        S1 --> S2[View Assigned Services]
        S2 --> S3[View Today's Appointments]
        S3 --> S4[Monitor Live Queue]
        S4 --> S5[Call Next Token]
        S5 --> S6{Customer Available?}
        S6 -->|No| S7[Skip or Recall Token]
        S7 --> S5
        S6 -->|Yes| S8[Provide Service]
        S8 --> S9[Mark Appointment Completed]
    end

    subgraph ADMIN["ADMIN WORKFLOW"]
        AD1 --> AD2[View Admin Dashboard]
        AD2 --> AD3[Manage Users]
        AD2 --> AD4[Manage Staff]
        AD2 --> AD5[Manage Services]
        AD2 --> AD6[Manage Schedules]
        AD2 --> AD7[Monitor Appointments]
        AD2 --> AD8[Manage Queue Policies]
        AD2 --> AD9[View Reports and Analytics]
        AD2 --> AD10[Manage System Settings]
    end

    U7 --> DB[(PostgreSQL Database)]
    U8 --> DB
    U10 --> DB
    S5 --> DB
    S9 --> DB
    AD3 --> DB
    AD4 --> DB
    AD5 --> DB
    AD6 --> DB
    AD7 --> DB

    DB --> N[Notification Service]
    N --> U9
    N --> U11

    U14 --> Z([End])
    S9 --> Z