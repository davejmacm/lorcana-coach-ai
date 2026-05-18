import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const placeholderMarkdown = `
### Mulligan Phase Analysis
* **Scuttle - Birdbrained**: Great keep against aggro.
* **Doc - Bold Knight**: Excellent ramp.
* You made the right call keeping this hand.

### The Pivot Turn
**Turn 5** was the critical moment.
* You opted to quest with **Robin Hood** instead of challenging their **Lilo**.
* This allowed them to sing **Be Prepared** for free next turn using shift, wiping your momentum.

### Key Takeaways
* Always respect Amber's wide boards.
* Prioritize challenging early questers if you don't have an immediate bounce spell.
* Consider holding back one inkable character to bait board wipes.
`;

const CoachAnalysisTabs = () => {
  const [activeTab, setActiveTab] = useState('mulligan');

  const tabs = [
    { id: 'mulligan', label: 'Mulligan Phase' },
    { id: 'pivot', label: 'The Pivot Turn' },
    { id: 'takeaways', label: 'Takeaways' }
  ];

  // In a real implementation, we would split the full markdown string based on ## Headers.
  // For now, we mock the sections.
  const getTabContent = () => {
    switch(activeTab) {
      case 'mulligan': return `### Mulligan Phase Analysis\n* **Scuttle - Birdbrained**: Great keep against aggro.\n* **Doc - Bold Knight**: Excellent ramp.\n* You made the right call keeping this hand.`;
      case 'pivot': return `### The Pivot Turn\n**Turn 5** was the critical moment.\n* You opted to quest with **Robin Hood** instead of challenging their **Lilo**.\n* This allowed them to sing **Be Prepared** for free next turn using shift, wiping your momentum.`;
      case 'takeaways': return `### Key Takeaways\n* Always respect Amber's wide boards.\n* Prioritize challenging early questers if you don't have an immediate bounce spell.\n* Consider holding back one inkable character to bait board wipes.`;
      default: return '';
    }
  };

  return (
    <div style={{ background: 'rgba(20, 20, 30, 0.9)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(142, 45, 226, 0.3)', marginTop: '1rem' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'transparent',
              color: activeTab === tab.id ? '#b388ff' : '#a0aec0',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #b388ff' : '2px solid transparent',
              padding: '10px 20px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="markdown-body" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '1rem' }}>
        <ReactMarkdown>{getTabContent()}</ReactMarkdown>
      </div>
    </div>
  );
};

export default CoachAnalysisTabs;
