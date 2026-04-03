import React, { useState } from 'react';

interface Voter {
  party  : string;
  vote   : 'For' | 'Against' | 'Abstain' | 'Pending';
}

interface ProposalCard {
  id            : string;
  title         : string;
  description   : string;
  proposer      : string;
  status        : 'Open' | 'Passed' | 'Rejected' | 'Vetoed' | 'Executed';
  quorumPct     : number;
  votingDeadline: string;
  voters        : Voter[];
}

function QuorumBar({ voters, quorumPct }: { voters: Voter[]; quorumPct: number }) {
  const total       = voters.length;
  const forCount    = voters.filter(v => v.vote === 'For').length;
  const againstCount= voters.filter(v => v.vote === 'Against').length;
  const abstainCount= voters.filter(v => v.vote === 'Abstain').length;
  const voted       = forCount + againstCount + abstainCount;
  const required    = Math.ceil(total * quorumPct / 100);
  const quorumMet   = voted >= required && forCount > againstCount;

  return (
    <div className="quorum-bar-wrapper">
      <div className="quorum-bar">
        <div className="bar-for"     style={{ width: `${(forCount/total)*100}%` }} />
        <div className="bar-against" style={{ width: `${(againstCount/total)*100}%` }} />
        <div className="bar-abstain" style={{ width: `${(abstainCount/total)*100}%` }} />
      </div>
      <div className="quorum-meta">
        <span className="for-count">{forCount} For</span>
        <span className="against-count">{againstCount} Against</span>
        <span className="abstain-count">{abstainCount} Abstain</span>
        <span className={`quorum-status ${quorumMet ? 'met' : 'unmet'}`}>
          {voted}/{total} voted · quorum {quorumMet ? '✓' : `needs ${required - voted} more`}
        </span>
      </div>
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: ProposalCard }) {
  const [expanded, setExpanded] = useState(false);
  const statusColors: Record<string, string> = {
    Open: '#5b6af9', Passed: '#22c55e', Rejected: '#ef4444',
    Vetoed: '#f59e0b', Executed: '#64748b',
  };

  return (
    <div className="proposal-card">
      <div className="proposal-header" onClick={() => setExpanded(e => !e)}>
        <span className="proposal-title">{proposal.title}</span>
        <span className="proposal-status" style={{ background: statusColors[proposal.status] }}>
          {proposal.status}
        </span>
      </div>

      {expanded && (
        <div className="proposal-body">
          <p className="proposal-description">{proposal.description}</p>
          <div className="proposal-meta">
            <span>Proposer: <code>{proposal.proposer}</code></span>
            <span>Deadline: {new Date(proposal.votingDeadline).toLocaleDateString()}</span>
            <span>Quorum: {proposal.quorumPct}%</span>
          </div>
          <QuorumBar voters={proposal.voters} quorumPct={proposal.quorumPct} />
        </div>
      )}
    </div>
  );
}

export default function ProposalBoard() {
  const [proposals] = useState<ProposalCard[]>([]);

  return (
    <div className="proposal-board">
      <div className="board-header">
        <h2>Active Governance Proposals</h2>
        <span className="proposal-count">{proposals.filter(p => p.status === 'Open').length} open</span>
      </div>

      {proposals.length === 0 ? (
        <div className="empty-state">No proposals yet. Create one to get started.</div>
      ) : (
        proposals.map(p => <ProposalCard key={p.id} proposal={p} />)
      )}
    </div>
  );
}
