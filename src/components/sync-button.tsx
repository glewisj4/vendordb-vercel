import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Cloud, Download, Upload, RefreshCw } from 'lucide-react';

export function SyncButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sync/export');
      const data = await response.json();
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendor-data-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Your data has been downloaded as a backup file.",
      });
    } catch (error) {
      toast({
        title: "Export Failed", 
        description: "Could not export data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!serverUrl.trim()) {
      toast({
        title: "Server URL Required",
        description: "Please enter your live server URL to sync.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // First, get remote data
      const remoteResponse = await fetch(`${serverUrl}/api/sync/export`);
      if (!remoteResponse.ok) {
        throw new Error('Failed to connect to remote server');
      }
      const remoteData = await remoteResponse.json();

      // Import remote data locally
      const importResponse = await fetch('/api/sync/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(remoteData)
      });

      if (!importResponse.ok) {
        throw new Error('Failed to import remote data');
      }

      const results = await importResponse.json();
      
      toast({
        title: "Sync Complete",
        description: `Imported ${results.results.imported} new records, updated ${results.results.updated} existing records.`,
      });
      
      setIsOpen(false);
      window.location.reload(); // Refresh to show synced data
      
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error.message || "Could not sync with remote server.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Cloud className="w-4 h-4 mr-2" />
          Sync
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Data Sync & Backup</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-url">Live Server URL</Label>
            <Input
              id="server-url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://your-app.replit.app"
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Enter your deployed app URL to sync data
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleSync} 
              disabled={isLoading || !serverUrl.trim()}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {isLoading ? 'Syncing...' : 'Sync with Live Server'}
            </Button>
            
            <Button 
              onClick={handleExport} 
              variant="outline"
              disabled={isLoading}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {isLoading ? 'Exporting...' : 'Export Backup File'}
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Sync downloads data from your live server</p>
            <p>• Export creates a local backup file</p>
            <p>• All your existing data will be preserved</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}