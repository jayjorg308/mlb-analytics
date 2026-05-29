# MLB Daily Analytics

A personal sports analytics platform for tracking MLB games, team performance, and pitcher statistics. Built as a hands-on exploration of full-stack engineering, sports data, and AWS deployment — driven by a longtime interest in sports analytics.

**Live site:** [jaysonjorgensen.dev](https://jaysonjorgensen.dev)

---

## What it does

The application pulls game data, team records, and player statistics from MLB's official API on a scheduled basis, transforms and stores the data in PostgreSQL, and serves it through a Next.js frontend. There are three main areas:

**Dashboard.** A daily view of every MLB game scheduled for the day — matchups, starting pitchers for each side, and final scores once games conclude. Designed to be the page I'd actually open before watching a game.

**Standings.** Team records grouped by division, along with a per-team ELO rating. The ELO calculation runs after each game completes, adjusting team ratings based on outcome and prior expected win probability — a more nuanced view of team strength than win/loss alone.

**Stats.** Pitching-focused statistics covering both individual pitchers and team-level pitching performance. The decision to focus on pitching reflects personal interest — pitching analytics is where most of the interesting modern baseball research happens, and the data is rich.

---

## Tech stack

**Frontend:** Next.js, React, TypeScript, Styled Components
**Backend:** Next.js API routes, Prisma ORM
**Database:** PostgreSQL
**Infrastructure:** Docker, AWS (ECS Fargate, ECR, RDS, ACM, Application Load Balancer), Cloudflare DNS
**Data source:** MLB's official statistics API

---

## Deployment

The application is deployed to AWS using:

- **ECR** for the Docker image registry
- **ECS Fargate (Express Mode)** for the container runtime
- **Application Load Balancer** routing public traffic, with multi-cert SNI for both the auto-generated AWS hostname and the custom domain
- **RDS PostgreSQL** for the database
- **ACM** for the TLS certificate
- **Cloudflare** for DNS

The Dockerfile uses a multi-stage build to keep the production image lean. Database credentials are injected at the container level rather than baked into the image.

---

## What's next

- **D3.js visualizations.** Currently extending the stats page with interactive charts — pitcher comparison views, pitch-type breakdowns, and team-level visualizations. The existing tables work but visualization is where the data gets genuinely useful.
- **Expanded hitting stats.** Pitching has been the focus so far; hitting metrics are on the roadmap.
- **Historical comparisons.** Year-over-year and rolling-window views for team and player performance.
- **CI/CD via GitHub Actions** to automate the build → ECR → ECS deployment cycle.

---

## Why I built this

I love sports, and I've spent more hours than I'd care to admit doing ad-hoc analysis in Google Sheets. This project is the natural progression — taking the analysis I'd do anyway and turning it into actual software. It's also been a chance to work end-to-end across a stack I don't always get to touch in my day job: data ingestion at scale, ELO modeling, Docker, AWS infrastructure.
