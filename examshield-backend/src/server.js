require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n  🛡️  ExamShield API`);
  console.log(`  ─────────────────────────────`);
  console.log(`  🚀 Server running at: http://localhost:${PORT}`);
  console.log(`  🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  ─────────────────────────────\n`);
});
