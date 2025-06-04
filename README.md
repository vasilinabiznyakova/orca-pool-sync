# Orca Pool Sync

**Orca Pool Sync** is a service for syncing Orca pool data into a PostgreSQL database.

## 🚀 Features

* Fetch and update Orca pool data via API.
* Save pool information to a PostgreSQL database.
* Scheduled sync tasks using cron jobs.
* Environment-based configuration with `.env`.
* Event logging with Winston.
* Organized project structure with custom clients and services.

## 📦 Scripts

| Script        | Description                         |
| ------------- | ----------------------------------- |
| `npm run dev` | Run the service in development mode |
| `npm test`    | Placeholder for future tests        |

## ⚙️ Installation

```bash
git clone https://github.com/vasilinabiznyakova/orca-pool-sync.git
cd orca-pool-sync
npm install
```

## 🛠️ Usage

1. Create a `.env` file based on `.env.example`:


2. Generate Prisma Client:

```bash
npm run prepare
```

This ensures the Prisma client is up to date with the latest schema.

3. Start the service:

```bash
npm run dev
```

## 🐛 Reporting Issues

If you encounter a bug or have a feature request, please open an [issue](https://github.com/vasilinabiznyakova/orca-pool-sync/issues).

## 📝 License

This project is not licensed. All rights reserved © 2025 [Vasylyna Bi](https://github.com/vasilinabiznyakova).

---
