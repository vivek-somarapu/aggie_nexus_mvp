// MCE staff get the same high-level view as aggiex_team
// but without management actions. Reuses the AggiexTeamDashboard layout
// with data passed through the same shape.
import AggiexTeamDashboard from './aggiex-team-dashboard';

interface MceStaffDashboardProps {
  data: Parameters<typeof AggiexTeamDashboard>[0]['data'];
}

export default function MceStaffDashboard({ data }: MceStaffDashboardProps) {
  return <AggiexTeamDashboard data={data} />;
}
