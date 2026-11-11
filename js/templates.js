/* ---------- Templates: [epic, [[story, [tasks]]]] ---------- */
const TEMPLATES = [
  {name: 'Mobile Game', desc: 'From concept to store launch, including prototype and live operations', data: [
    ['Concept & Design', [
      ['Game Vision', ['Define the one-line game concept and target audience', 'Analyze competitor and reference titles', 'Define the monetization model']],
      ['Game Design Document', ['Write the core gameplay loop', 'Define controls and camera scheme', 'Plan progression and difficulty curve']]]],
    ['Prototype', [
      ['Technical Foundation', ['Set up game engine and project structure', 'Establish version control and backup process', 'Define performance budget for target devices']],
      ['Core Mechanics', ['Implement player movement and controls', 'Implement basic obstacle and enemy behavior', 'Deliver first playable scene']]]],
    ['Production', [
      ['Content', ['Design levels and stages', 'Create character, environment and UI art', 'Produce music and sound effects']],
      ['Systems', ['Implement score, lives and rewards system', 'Implement menu, settings and save system', 'Integrate ads and in-app purchases']]]],
    ['Testing & Polish', [
      ['Quality Assurance', ['Collect and prioritize bug reports', 'Run device compatibility testing', 'Gather player feedback through closed beta']],
      ['Optimization', ['Profile frame rate and memory usage', 'Reduce application size', 'Improve startup time']]]],
    ['Launch & Live Ops', [
      ['Store Readiness', ['Prepare store listing, icon and screenshots', 'Finalize privacy policy and age rating', 'Build and submit release package']],
      ['Live Operations', ['Monitor analytics and crash reports', 'Respond to user reviews', 'Plan the first content update']]]]
  ]},
  {name: 'Mobile App', desc: 'Discovery, design, development and store release', data: [
    ['Discovery & Planning', [
      ['Product Definition', ['Define the problem to solve and the target user', 'Review competing applications', 'Define scope: limit features for the first release']],
      ['Requirements', ['Write user stories', 'Select the technology stack', 'Define timeline and milestones']]]],
    ['Design', [
      ['User Experience', ['Map user flows', 'Create wireframes', 'Conduct usability testing']],
      ['User Interface', ['Define color, typography and component library', 'Create high-fidelity designs for key screens', 'Review dark mode and accessibility']]]],
    ['Development', [
      ['Foundation', ['Set up project skeleton and folder structure', 'Implement authentication and user data', 'Connect API and data layer']],
      ['Features', ['Core feature 1', 'Core feature 2', 'Push notifications and offline support']]]],
    ['Testing', [
      ['Quality Assurance', ['Write unit and integration tests', 'Run manual tests on real devices', 'Complete security and privacy review']],
      ['Closed Beta', ['Identify beta testers', 'Prepare feedback form', 'Resolve critical bugs']]]],
    ['Release', [
      ['Store Process', ['Prepare store listing and assets', 'Complete privacy policy and data disclosure', 'Submit for review and publish']],
      ['Post-Release', ['Monitor crash and usage analytics', 'Collect user feedback', 'Plan the next release']]]]
  ]},
  {name: 'Website / Web Application', desc: 'Planning, design, development and go-live', data: [
    ['Planning', [
      ['Goals & Scope', ['Define goals and success criteria', 'Identify target audience and site structure', 'Decide on domain name and hosting']],
      ['Content Strategy', ['Create a content inventory', 'Assign copy and visual owners', 'Define SEO keywords']]]],
    ['Design', [
      ['Page Design', ['Create sitemap and wireframes', 'Design home page and inner pages', 'Define responsive layouts']],
      ['Brand Consistency', ['Define color and typography system', 'Create logo and icon set', 'Optimize images']]]],
    ['Development', [
      ['Front End', ['Build page templates', 'Add forms and interactions', 'Run accessibility checks']],
      ['Back End', ['Design data model and API', 'Build authentication and admin panel', 'Integrate email and third-party services']]]],
    ['Testing & Optimization', [
      ['Quality', ['Run browser and device compatibility tests', 'Verify links and forms', 'Run security scan']],
      ['Performance & SEO', ['Measure and improve page speed', 'Configure meta tags and sitemap', 'Set up analytics']]]],
    ['Go-Live', [
      ['Launch', ['Configure domain, SSL and DNS', 'Deploy to production', 'Set up backups']],
      ['Post-Launch', ['Monitor errors and traffic', 'Create content calendar', 'Plan maintenance and updates']]]]
  ]},
  {name: 'Software Product (MVP)', desc: 'First-release roadmap for startups and product teams', data: [
    ['Product Discovery', [
      ['Problem Validation', ['Conduct interviews with target users', 'Document problem and solution hypotheses', 'Map competitors and alternatives']],
      ['MVP Scope', ['Select must-have features', 'Define success metrics', 'List out-of-scope items explicitly']]]],
    ['Architecture & Setup', [
      ['Technical Design', ['Select architecture and technology', 'Define data model and API contracts', 'Set up environments (dev / staging / production)']],
      ['Process', ['Define version control and branching strategy', 'Set up CI/CD pipeline', 'Set up board and sprint cadence']]]],
    ['Development Sprints', [
      ['Core Features', ['User management', 'Primary workflow', 'Admin and reporting screens']],
      ['Quality', ['Automated test coverage', 'Code review process', 'Error tracking and logging']]]],
    ['Pilot & Feedback', [
      ['Pilot Users', ['Identify the first user group', 'Collect usage data and feedback', 'Produce a prioritized improvement backlog']],
      ['Readiness', ['Complete security and load review', 'Publish terms of use and privacy notice', 'Set up the support channel']]]],
    ['Launch', [
      ['Announcement', ['Create landing page and announcement copy', 'Reach out to first customers', 'Decide on pricing']],
      ['Next Steps', ['Monitor the metrics dashboard', 'Hold weekly product reviews', 'Draft the next quarter roadmap']]]]
  ]},
  {name: 'Corporate Project Management', desc: 'Classic project lifecycle adaptable to any industry', data: [
    ['Initiation', [
      ['Project Definition', ['Document objectives, scope and expected deliverables', 'Identify stakeholders and sponsor', 'Obtain approval of the project charter']],
      ['Feasibility', ['Estimate budget and resources', 'Perform preliminary risk assessment', 'Clarify success criteria']]]],
    ['Planning', [
      ['Scope & Schedule', ['Create the work breakdown structure (WBS)', 'Define schedule and milestones', 'Identify dependencies and the critical path']],
      ['Management Plans', ['Prepare risk and change management plans', 'Define communication plan and meeting cadence', 'Establish roles and responsibilities (RACI)']]]],
    ['Execution', [
      ['Delivery', ['Assign work to the team and kick off', 'Hold weekly progress meetings', 'Record deliverables']],
      ['Monitoring & Control', ['Track budget and schedule variances', 'Update the risk register', 'Send regular status reports to stakeholders']]]],
    ['Closure', [
      ['Handover', ['Deliver outputs to the client / sponsor', 'Obtain acceptance sign-off', 'Close contracts and payments']],
      ['Lessons Learned', ['Hold the closing meeting', 'Document lessons learned', 'Archive project files and release the team']]]]
  ]},
  {name: 'Marketing Campaign', desc: 'Strategy, content production, launch and measurement', data: [
    ['Strategy', [
      ['Goals & Audience', ['Define campaign goals and measurable KPIs', 'Define target audience and personas', 'Define key message and positioning']],
      ['Plan', ['Select channels and allocate budget', 'Create the publishing calendar', 'Assign responsibilities']]]],
    ['Content Production', [
      ['Copy & Creative', ['Write slogan and main copy', 'Produce visual and video assets', 'Build the landing page']],
      ['Approval', ['Complete internal review', 'Obtain brand and legal approval', 'Deliver final files']]]],
    ['Launch', [
      ['Channels', ['Publish social media posts', 'Send email campaign', 'Launch paid advertising']],
      ['Partnerships', ['Reach out to influencers and partners', 'Issue press release', 'Engage the community']]]],
    ['Measurement', [
      ['Analysis', ['Collect metrics weekly', 'Compare results against goals', 'Evaluate A/B test results']],
      ['Reporting', ['Prepare campaign results report', 'Document learnings and recommendations', 'Prepare inputs for the next campaign']]]]
  ]},
  {name: 'Finance: Agent-Assisted Market Analysis & Trading', desc: 'Agent and skill setup, US equities, crypto and laddered-entry analysis, live trade tracking', data: [
    ['1. Objectives & Framework', [
      ['Scope', ['Define objectives: expected return, time horizon, trading frequency', 'Define the asset universe (US equities, crypto, other)', 'Define starting capital and maximum acceptable loss']],
      ['Rules & Compliance', ['Define risk rules (risk per trade %, daily / monthly maximum loss)', 'Research tax and regulatory obligations', 'Define agent authority: analysis only, or order placement as well']]]],
    ['2. Agent & Skill Infrastructure', [
      ['Claude Setup', ['Set up the Claude Code / Agent SDK environment', 'Define project structure and write CLAUDE.md instructions', 'Store API keys securely (.env, never committed)']],
      ['Skill Discovery & Onboarding', ['Research existing finance skills and MCP servers', 'Shortlist candidate skills: source, security and license review', 'Install selected skills and test with a sample task', 'Build custom skills for gaps (e.g. report template, risk calculator)']],
      ['Agent Design', ['Define agent roles: data collector, analyst, risk reviewer, reporter', 'Define inter-agent workflow and output format', 'Hallucination control: every figure must cite a source']]]],
    ['3. Data Sources', [
      ['Market Data', ['Select US equity data source (prices, financials, news)', 'Select crypto data source (exchange API, on-chain data)', 'Validate data quality and latency', 'Download and store historical data']],
      ['News & Macro', ['Economic calendar (rate decisions, inflation, employment)', 'Corporate earnings calendar', 'News and sentiment sources']]]],
    ['4. Market Analysis', [
      ['US Equities', ['Build the watchlist', 'Fundamental analysis: revenue, earnings, debt, valuation', 'Technical analysis: trend, support / resistance, volume', 'Sector and index comparison']],
      ['Crypto', ['Build the watchlist', 'Technical analysis and market structure', 'Liquidity, volume and exchange risk review', 'BTC and broad-market correlation']],
      ['Laddered Entries', ['Define ladder levels (entry range, step size, size per rung)', 'Calculate total position and average cost', 'Define stop-loss and exit rungs', 'Simulate the ladder strategy on historical data']],
      ['Reporting', ['Daily market summary template', 'Weekly outlook and scenarios (bullish / neutral / bearish)', 'Document thesis, risk and invalidation condition for every idea']]]],
    ['5. Strategy & Testing', [
      ['Backtesting', ['Codify the rules', 'Include commissions, slippage and tax', 'Test across different market regimes (avoid overfitting)']],
      ['Paper Trading', ['Run forward test on a paper account for at least 4-8 weeks', 'Log every signal and outcome', 'Define go-live criteria (hit rate, maximum drawdown, consistency)']]]],
    ['6. Live Trading & Monitoring', [
      ['Go-Live', ['Set up brokerage / exchange account and API permissions (least privilege, withdrawals disabled)', 'Start with small capital', 'Add a human approval step before every order']],
      ['Trade Journal', ['Record every trade: date, asset, entry / exit, size, rationale', 'Open positions and ladder rung table', 'Track realized and unrealized P&L']],
      ['Risk & Alerts', ['Price and stop-loss alerts', 'Portfolio allocation and concentration check', 'Halt trading when the maximum loss limit is breached']]]],
    ['7. Operations & Improvement', [
      ['Routine', ['Daily: market summary and open position check', 'Weekly: performance and rule-compliance report', 'Monthly: strategy review and tax records']],
      ['Continuous Improvement', ['Post-mortem on losing decisions', 'Research new skills and data sources', 'Update agent instructions and risk rules']]]]
  ]}
];

