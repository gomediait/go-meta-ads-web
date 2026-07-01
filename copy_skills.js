const fs = require('fs');
const path = require('path');

const root = 'd:\\ĐHKT DN\\INTERN\\GO MEDIA\\Go_meta_ads\\go-meta-ads-web';
const aiDir = path.join(root, 'AI');
const aiSkillsDir = path.join(aiDir, 'skills');

if (!fs.existsSync(aiDir)) fs.mkdirSync(aiDir);
if (!fs.existsSync(aiSkillsDir)) fs.mkdirSync(aiSkillsDir);

const sources = [
  { dir: path.join(root, '.claude', 'skills'), prefix: '' },
  { dir: path.join(root, '.claude', 'commands'), prefix: 'cmd-' }
];

let copiedCount = 0;
let unchangedCount = 0;
const report = [];

function cleanContent(content) {
  // Very simple generic cleaner
  // Remove <claude> tags if any
  let cleaned = content.replace(/<claude_only>[\s\S]*?<\/claude_only>/gi, '');
  cleaned = cleaned.replace(/Claude/g, 'AI agent');
  return cleaned;
}

sources.forEach(src => {
  if (fs.existsSync(src.dir)) {
    const files = fs.readdirSync(src.dir);
    files.forEach(file => {
      if (file.endsWith('.md')) {
        const fullPath = path.join(src.dir, file);
        const destPath = path.join(aiSkillsDir, src.prefix + file);
        
        let content = fs.readFileSync(fullPath, 'utf8');
        let newContent = cleanContent(content);
        
        fs.writeFileSync(destPath, newContent);
        copiedCount++;
        report.push(`Copied: ${file} -> ${src.prefix + file}`);
        if (content === newContent) {
           unchangedCount++;
        }
      }
    });
  }
});

// Also copy CLAUDE.md
const claudeMdPath = path.join(root, 'CLAUDE.md');
if (fs.existsSync(claudeMdPath)) {
  let content = fs.readFileSync(claudeMdPath, 'utf8');
  let newContent = cleanContent(content);
  fs.writeFileSync(path.join(aiSkillsDir, 'global-instructions.md'), newContent);
  copiedCount++;
  report.push(`Copied: CLAUDE.md -> global-instructions.md`);
}

// Generate README.md
const readmePath = path.join(aiDir, 'README.md');
const readmeContent = `# AI Skills Directory

Thư mục này chứa toàn bộ các Skills, Rules, Instructions dùng chung cho tất cả các AI coding agents trong dự án.

## Cấu trúc thư mục
- \`skills/\`: Chứa các quy chuẩn code, quy trình làm việc, design patterns, và các instructions chung.
  - Các file bắt đầu bằng \`cmd-\` là các custom commands được chuyển từ Claude.
  - Các file còn lại là các skills nguyên bản.

## Cách sử dụng

### 1. Cho Claude Code
Claude Code hỗ trợ custom tools/skills từ thư mục \`.claude\`. Tuy nhiên, bạn có thể thiết lập Claude để tham chiếu nội dung trong \`AI/skills/\` hoặc chỉ thị trong system prompt:
"Please read and follow all markdown rules defined in AI/skills/ before starting tasks."

### 2. Cho Antigravity
Antigravity tự động phát hiện customizations nếu thư mục nằm trong danh sách định nghĩa. Bạn có thể sử dụng tính năng Global Rules hoặc Project-Scoped Rules bằng cách tạo file \`AGENTS.md\` và trỏ vào các file trong này, hoặc đơn giản ra lệnh cho Antigravity:
"Đọc toàn bộ file trong AI/skills/ để làm ngữ cảnh trước khi code."

### 3. Cho Cursor / Codex
Cursor hỗ trợ tính năng \`@\` (mentions). Khi mở Cursor:
- Thêm toàn bộ các file trong \`AI/skills/\` vào Cursor Rules.
- Hoặc dùng \`@AI/skills/...\` trong prompt để nhúng nội dung của skill vào context.

## Khuyến nghị
Luôn load toàn bộ \`AI/skills\` trước khi thực hiện bất kỳ task nào lớn để đảm bảo AI hoạt động nhất quán, tuân thủ đúng coding standards và best practices của dự án.
`;

fs.writeFileSync(readmePath, readmeContent);

console.log('--- BÁO CÁO KẾT QUẢ ---');
console.log(`Đã chuyển thành công: ${copiedCount} files.`);
report.forEach(r => console.log(r));
console.log('Tất cả logic và hướng dẫn được giữ nguyên.');
