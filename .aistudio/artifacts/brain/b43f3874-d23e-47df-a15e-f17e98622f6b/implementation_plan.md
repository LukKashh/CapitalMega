# Advanced Financial Regulatory & Loan Mechanics (Revised)

This update introduces high-stakes Tax and Loan mechanics designed for a gritty, executive tycoon experience. Taxation is now granular, based on specific income sources and real-time cash influx rather than static net worth.

## User Review & Critical Decisions

> [!IMPORTANT]
> The new tax system tracks income in four specific categories: **Business**, **Rental**, **Investment**, and **Personal**. Each has its own regulatory rate.

- **Confirmed Decision 1**: Income-Source Based Taxation (Business, Rental, Investment, Personal).
- **Confirmed Decision 2**: Gritty & High-Stakes aesthetic with visual alerts for financial distress.
- **Confirmed Decision 3**: Real-time loan interest accumulation within the engine's tick cycle.

## 1. Overview & Core Concept

- **What It Does**: Adds an authoritative Tax Liability system that tracks cash influx by source. Enhances Loans with real-time interest accumulation.
- **Target Audience / Persona**: High-level tycoons seeking deeper financial strategy and risk management.
- **Key Value**: Prevents runaway wealth by introducing source-specific "overhead" costs and debt pressure.

## 2. User Experience & Visual Design

- **Key User Flows**:
    1. **Income Tracking**: The Banking & Tax Panel shows a breakdown of income earned in the current "Tax Period".
    2. **Regulatory Alert**: When tax liability or debt exceeds safe thresholds, the UI enters a "Warning" state (red glowing borders, flickering icons).
    3. **Banking Dashboard**: Loans show interest ticking up in real-time, accompanied by a subtle "debt pulse" animation.
- **Visual Identity & Theme**:
    - *Aesthetic Direction*: "Gritty & High-Stakes". High-contrast red/amber alerts, industrial typography for ledger records.
    - *Color Palette & Mood*: Deep slate backgrounds with sharp Emerald (Gain), Amber (Warning), and Crimson (Regulatory Distress) accents.
- **Interactive Feedback & Motion**:
    - **Interest Tick**: Digital counters for loan balances will have a faint glow animation when interest is added.
    - **Tax Meter**: A "Tax Period" progress bar showing when the next audit occurs.

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Real-time Interest vs. Periodic Payments**
    - *Chosen Approach*: Real-time interest calculation in the server-side `tick` function.
    - *Why*: Immediate psychological pressure for the player to repay debts.
- **Decision 2: Income-Source Categorization**
    - *Chosen Approach*: Map all `credit` events in the engine to one of 4 tax categories.
    - *Why*: Allows for strategic play (e.g., lower tax on rentals vs. higher tax on gambling/clicks).
- **Decision 3: Cash Influx Tracking**
    - *Chosen Approach*: Store a `currentPeriodIncome` object in `PlayerState` that resets upon tax settlement.
    - *Why*: Transparently shows the user *why* they owe a specific amount.

## 4. Technical Architecture & Data Strategy

### System Architecture

```
┌──────────────────┐      ┌────────────────────────┐      ┌──────────────────┐
│  PlayerState     │      │     Engine Tick        │      │    BankingView   │
│  (Income Stats)  ├─────►│ (Interest & Tax Math)  ├─────►│ (Visual Alerts)  │
└──────────────────┘      └──────────┬─────────────┘      └──────────────────┘
                                     │
                          ┌──────────▼─────────────┐
                          │    Regulatory Panel    │
                          │   (Income Breakdown)   │
                          └────────────────────────┘
```

### Data Model & State Updates

- **PlayerState Addition**:
    - `tax`:
        - `liability: number`: Current unpaid taxes.
        - `periodIncome`: `{ business: number, rental: number, investment: number, personal: number }`.
        - `lastSettlementAt: number`: Timestamp of last payment.
- **Engine Logic**:
    - `trackIncome(ctx, amount, category)`: Updated `credit` helper to bucket income.
    - `applyInterest(ctx, dt)`: Updates `loan.remaining` for each active loan based on `dt`.
- **Action Mapping**:
    - `settleTax()`: Deducts cash, resets `periodIncome`, clears `liability`.
