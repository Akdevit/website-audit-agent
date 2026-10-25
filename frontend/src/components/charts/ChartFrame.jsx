import { ResponsiveContainer } from 'recharts';

export default function ChartFrame({ label, height = 240, children }) {
  return <div role="img" aria-label={label} className="min-w-0 w-full" style={{height}}><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width:640,height}}>{children}</ResponsiveContainer></div>;
}
