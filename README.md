![Deploy](https://github.com/jayjorg308/mlb-analytics/actions/workflows/deploy.yml/badge.svg)

# MLB Daily Analytics
 
A personal sports analytics platform for tracking MLB games, team performance, and pitcher statistics. Built as a hands-on exploration of full-stack engineering, sports data, and AWS deployment — driven by a longtime interest in sports analytics.
 
**Live site:** [jaysonjorgensen.dev](https://jaysonjorgensen.dev)
 
![Dashboard view](./docs/screenshots/dashboard.png)
 
---
 
## What it does
 
The application pulls game data, team records, and player statistics from MLB's official API on a scheduled basis, transforms and stores the data in PostgreSQL, and serves it through a Next.js frontend. There are three main areas:
 
### Dashboard
 
A daily view of every MLB game scheduled for the day — matchups, starting pitchers for each side, computed win probabilities derived from team ELO, and final scores once games conclude. Designed to be the page I'd actually open before watching a game.
 
![Game card closeup](./docs/screenshots/game-card.png)
 
### Standings
 
Team records grouped by full league standings, with home/away splits, current ELO rating, and season-long ELO change. The ELO calculation runs after each completed game, adjusting team ratings based on outcome and prior expected win probability. It's a more nuanced view of team strength than win/loss alone — a team with a high ELO and a mediocre record has been losing close games to strong opponents, while a team with a low ELO and a great record has been beating weak teams convincingly. Both stories matter.
 
![Standings with ELO ratings](./docs/screenshots/standings.png)
 
### Stats
 
Pitching-focused statistics covering both individual pitchers and team-level pitching performance. The decision to focus on pitching reflects personal interest — pitching analytics is where most of the interesting modern baseball research happens, and the data is rich enough to be worth digging into.
 
![Individual pitcher stats](./docs/screenshots/pitcher-stats.png)
 
The Average Pitching Score column is a custom metric calculated per game and aggregated across the season. More on the formula below.
 
![Team pitching stats](./docs/screenshots/team-pitching.png)
 
---
 
## How pitching scores are calculated
 
Every pitcher in the database gets a per-appearance score and a season average. The formula is:
 
```
Score = 47.4 + (1.5 × outs) + strikeouts − (2 × walks) − (2 × hits) − (3 × runs) − (4 × home runs)
```
 
Each component reflects a deliberate weighting choice:
 
- **47.4 baseline** anchors the score so an average outing lands in a familiar range (roughly 50 for a league-average start)
- **+1.5 per out** rewards length — a pitcher who works deep into a game is doing real value
- **+1 per strikeout** rewards dominance independent of defense
- **−2 per walk** penalizes lack of control
- **−2 per hit** penalizes contact allowed
- **−3 per run** penalizes the actual scoring outcome regardless of how it happened
- **−4 per home run** adds an extra penalty for the worst possible outcome of contact
The formula is in the tradition of Bill James's original Game Score metric, with adaptations: the "1 per out + 2 per inning after the 4th" structure of Game Score is collapsed into a flat 1.5-per-out multiplier, and a home run penalty is added because in modern baseball home runs deserve to be tracked as a distinct category, not just absorbed into the runs penalty.
 
For reference, here's roughly how scores translate:
 
| Score | Interpretation |
|-------|----------------|
| 70+ | Excellent start |
| 55-70 | Solid outing |
| 40-55 | Mediocre |
| Below 40 | Poor |
 
The Team Average Pitching Score on the team stats page averages this metric across every starting pitcher appearance for the team. It serves as a rough single-number indicator of starting rotation quality — useful for at-a-glance comparisons that ERA alone can flatten.

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

---

## Why I built this

I love sports, and I've spent more hours than I'd care to admit doing ad-hoc analysis in Google Sheets. This project is the natural progression — taking the analysis I'd do anyway and turning it into actual software. It's also been a chance to work end-to-end across a stack I don't always get to touch in my day job: data ingestion at scale, ELO modeling, Docker, AWS infrastructure.
