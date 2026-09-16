# PIPNEX FOREX TRADING BOT - DATABASE SYSTEM SPECIFICATION & DOCUMENTATION

## 1. Executive Summary & Architecture

The **PipNex Forex Trading Bot Database System** is powered by a high-performance **PostgreSQL** relational database deployed on **Cloud SQL (Region: `europe-west2`)**. It provides ACID compliance, strong relational integrity, connection pooling via `pg.Pool`, and schema modeling through **Drizzle ORM**.

Authentication and secure session federation are integrated with **Firebase Authentication & Google OAuth**, linking the user's Google/JWT credentials directly to their relational database account, trading portfolio, MT4/MT5 accounts, and algorithmic bot settings.

---

## 2. Entity-Relationship (ER) Diagram

```text
       +-------------------------------------------------------------+
       |                           USERS                             |
       |-------------------------------------------------------------|
       | id (PK, TEXT)                                               |
       | uid (TEXT, UNIQUE)                                          |
       | full_name (VARCHAR)                                         |
       | email (VARCHAR, UNIQUE)                                     |
       | google_id (VARCHAR, UNIQUE)                                 |
       | profile_picture (TEXT)                                      |
       | account_type (VARCHAR: Free/Premium/Pro)                    |
       | country, phone, email_verified, two_factor_enabled          |
       | is_active (BOOLEAN), created_at, last_login, updated_at     |
       +-----------------------------+-------------------------------+
                                     |
           +-------------------------+-------------------------+
           | 1:N                     | 1:1                     | 1:N
           v                         v                         v
+-----------------------+ +-----------------------+ +-----------------------+
|   TRADING_ACCOUNTS    | |     BOT_SETTINGS      | |     NOTIFICATIONS     |
|-----------------------| |-----------------------| |-----------------------|
| id (PK, TEXT)         | | id (PK, TEXT)         | | id (PK, TEXT)         |
| user_id (FK -> users) | | user_id (FK, UNIQUE)  | | user_id (FK -> users) |
| account_name (VARCHAR)| | bot_name, bot_version | | type (Trade Alert/...) |
| account_number (UNIQUE| | strategy (Scalping/..)| | title, message        |
| broker (MT4/MT5/...)  | | risk_per_trade (%)    | | priority (Low/Med/Hi) |
| account_type(Demo/Live| | max_daily_loss ($)    | | is_read (BOOLEAN)     |
| initial_balance ($)   | | max_position_size     | | created_at, read_at   |
| current_balance ($)   | | stop_loss_default     | +-----------------------+
| equity, margin, free  | | take_profit_default   |
| leverage (1:100...)   | | trading_days (JSONB)  |
| currency (USD/EUR...) | | trading_start/end     |
| status, created_at    | | indicators_used(JSONB)|
+-----------+-----------+ | auto_trade (BOOLEAN)  |
            |             | email/push/sms_alerts |
            | 1:N         +-----------------------+
            v
+-----------------------+ +-----------------------+ +-----------------------+
|        TRADES         | |  PERFORMANCE_METRICS  | |     TRANSACTIONS      |
|-----------------------| |-----------------------| |-----------------------|
| id (PK, TEXT)         | | id (PK, TEXT)         | | id (PK, TEXT)         |
| user_id (FK -> users) | | user_id (FK -> users) | | user_id (FK -> users) |
| account_id (FK -> acc)| | account_id (FK -> acc)| | account_id (FK -> acc)|
| symbol (EUR/USD, ...) | | date (YYYY-MM-DD)     | | type (Deposit/...)    |
| trade_type (BUY/SELL) | | total_trades, win_rate| | amount, currency      |
| entry_price, exit_prc | | total_profit/loss     | | status (Pending/Done) |
| stop_loss, take_profit| | net_profit, avg_win   | | payment_method (Mpesa)|
| lot_size, profit_loss | | profit_factor, sharpe | | reference_id, notes   |
| status, strategy, dur | | max_drawdown, roi (%) | | created_at, completed |
+-----------------------+ +-----------------------+ +-----------------------+
                                                               |
                                                               | 1:N (From Users)
                                                               v
                                                    +-----------------------+
                                                    |       API_KEYS        |
                                                    |-----------------------|
                                                    | id (PK, TEXT)         |
                                                    | user_id (FK -> users) |
                                                    | integration_type (MT5)|
                                                    | api_key (Encrypted)   |
                                                    | api_secret (Encrypted)|
                                                    | access_level, status  |
                                                    +-----------------------+
```

---

## 3. Database Tables & Descriptions

1. **`users`**: Master user directory storing authentication details, account plans (Free, Premium, Pro), verification states, and OAuth identifiers.
2. **`trading_accounts`**: Manages connected MT4, MT5, cTrader, and Prop Firm accounts with balances, margin calculations, and leverage.
3. **`trades`**: Tracks historical and real-time open positions, entry/exit prices, lot sizes, P&L, stop loss, and take profit levels.
4. **`bot_settings`**: Stores automated trading engine configurations, risk per trade, max daily loss limits, active indicators, and schedule hours.
5. **`performance_metrics`**: Daily aggregated analytics including Win Rate (%), Sharpe Ratio, Maximum Drawdown, Net Profit, and ROI.
6. **`transactions`**: Comprehensive financial ledger for deposits, withdrawals, subscription billings, and M-Pesa / Card payments.
7. **`notifications`**: Real-time push, trade alert, and risk mitigation event stream.
8. **`api_keys`**: Secure credentials storage for third-party broker APIs and crypto exchanges.

---

## 4. PostgreSQL Views & Optimizations

### Optimized Views
- **`user_dashboard_summary`**: Aggregates total balances, equities, active trades count, and realized PnL per user in a single low-latency query.
- **`active_trades_view`**: Materializes open market positions joined with account identifiers for real-time risk monitoring.

### Indexes
- `idx_trading_accounts_user_id` on `trading_accounts(user_id)`
- `idx_trades_user_id` on `trades(user_id)`
- `idx_trades_account_id` on `trades(account_id)`
- `idx_trades_symbol` on `trades(symbol)`
- `idx_trades_status` on `trades(status)`
- `idx_trades_entry_time` on `trades(entry_time DESC)`
- `idx_performance_metrics_user_date` on `performance_metrics(user_id, date)`
- `idx_notifications_user_unread` on `notifications(user_id, is_read)`

---

## 5. Security & Connection Pooling

- **Connection Pool**: Implemented with `pg.Pool` with idle error handling, max 10 concurrent clients, and request timeouts.
- **Credential Storage**: Environment-isolated using runtime variables `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, and `SQL_DB_NAME`.
- **Query Sanitization**: Drizzle ORM parameterized queries prevent SQL injection attacks.
