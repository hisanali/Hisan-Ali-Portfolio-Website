const fs = require('fs');
const docs = [
  'seo-checklist.pdf',
  'ads-brief-template.pdf',
  'content-calendar.pdf',
  'analytics-dashboard-guide.pdf',
  'email-checklist.pdf',
  'cro-testing-log.pdf',
  'ecommerce-launch-kit.pdf',
  'wordpress-build-plan.pdf',
  'mailchimp-flow.pdf',
  'freelancer-proposal.pdf',
  'landing-page-brief.pdf',
  'ga-tracking-sheet.pdf'
];
for (const name of docs) {
  fs.writeFileSync(`public/docs/${name}`, `Placeholder for ${name} - replace with a real PDF when ready.\nGenerated on 2026-01-29.`);
}
console.log('docs seeded');
