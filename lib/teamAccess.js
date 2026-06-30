export async function getEffectiveContext(userId, sb) {
  // Check if this user is a team member for someone else
  const { data: member } = await sb
    .from('team_members')
    .select('owner_id, role')
    .eq('user_id', userId)
    .single()

  if (member) {
    return {
      userId,
      ownerId: member.owner_id,
      role: member.role, // 'viewer', 'manager', 'admin'
      isTeamMember: true
    }
  }

  // Not a team member -> they are the owner of their own workspace
  return {
    userId,
    ownerId: userId,
    role: 'admin', // Owners have all permissions
    isTeamMember: false
  }
}

export function hasPermission(context, action) {
  if (context.role === 'admin') return true;

  const permissions = {
    // Actions allowed for Viewer & Manager
    'view_dashboard': ['manager', 'viewer'],
    'view_profit':    ['manager', 'viewer'],
    'view_report':    ['manager', 'viewer'],
    
    // Actions allowed for Manager only
    'toggle_campaign': ['manager'], // Bật/tắt chiến dịch
    'policy_check':    ['manager'], // Kiểm tra vi phạm
    'manage_autoset':  ['manager'], // Cài đặt quy tắc cắt lỗ
    
    // Actions allowed for Admin only (Empty arrays mean only 'admin' can bypass)
    'manage_autocare':      [], // Cài đặt Auto Care (tắt/mở ban đêm)
    'manage_team':          [], // Quản lý nhóm
    'manage_fb':            [], // Kết nối / ngắt kết nối Facebook Ads
    'manage_notifications': []  // Cài đặt thông báo Telegram/Lark
  };

  const allowedRoles = permissions[action] || [];
  return allowedRoles.includes(context.role);
}
