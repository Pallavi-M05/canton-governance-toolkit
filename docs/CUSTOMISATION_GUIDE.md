# Customisation Guide

The Canton Governance Toolkit is template-based — you configure quorum thresholds,
veto windows, and time-lock periods to match your governance requirements.

## Quorum threshold

Set `quorumPct` on the `Proposal` contract (1–100):

```daml
create Proposal with
  quorumPct = 66   -- simple majority of voters must participate AND For > Against
```

Common patterns:
- **Simple majority**: `quorumPct = 50` + `forVotes > againstVotes`
- **Supermajority**: `quorumPct = 66` (two-thirds)
- **Unanimous**: `quorumPct = 100`

## Time-lock window

Set `executeAfter` and `executeBefore` on `TimeLock`:

```daml
create TimeLock with
  executeAfter  = addRelTime now (hours 48)  -- 2-day review period
  executeBefore = addRelTime now (hours 72)  -- 1-day execution window
```

## Veto window

Set `vetoDeadline` on `VetoRight`:

```daml
create VetoRight with
  vetoDeadline = addRelTime now (hours 24)  -- guardian has 24h to veto
```

## Vote delegation

Allow a voter to delegate to a trusted proxy:

```daml
create VoteDelegation with
  delegator  = alice
  delegate   = proxy
  proposer   = treasury
  validUntil = addRelTime now (days 30)
```

## Without a guardian (no veto)

Set `guardian = None` on the `Proposal`. The toolkit skips the veto phase.

## Multi-step proposals

Chain multiple `TimeLock` contracts with sequential `executeAfter` timestamps
to implement staged roll-outs with approval gates between phases.
