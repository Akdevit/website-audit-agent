import { Component } from 'react';
import BrandLogo from '@/components/brand/BrandLogo';
import { Button } from '@/components/ui/Button';

export default class AppErrorBoundary extends Component {
  state = { failed:false };
  static getDerivedStateFromError() {return {failed:true};}
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12"><BrandLogo /><h1 className="mt-10 text-2xl font-semibold tracking-tight">The workspace could not load.</h1><p className="mt-3 text-sm leading-7 text-muted">Refresh to load the latest version. Saved audits will remain in your history.</p><div className="mt-6"><Button onClick={() => window.location.reload()}>Reload workspace</Button></div></main>;
  }
}
