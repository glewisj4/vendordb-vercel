import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, UserPlus, User, Phone, Mail, Building, Edit, Download, MailIcon, CheckSquare, X, ArrowUpDown } from "lucide-react";
import { type Representative, type Vendor } from "@shared/schema";
import AddRepresentativeModal from "@/components/modals/add-representative-modal";
import EditRepresentativeModal from "@/components/modals/edit-representative-modal";
import { exportRepresentativesToPDF } from "@/lib/pdf-export";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/lib/phone-utils";

export default function Representatives() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRepresentative, setSelectedRepresentative] = useState<Representative | null>(null);
  const [mailingListMode, setMailingListMode] = useState(false);
  const [selectedReps, setSelectedReps] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data: representatives, isLoading } = useQuery<Representative[]>({
    queryKey: ["/api/representatives"],
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { toast } = useToast();

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Apply sorting to representatives
  const sortedRepresentatives = representatives?.sort((a, b) => {
    let aValue = '', bValue = '';
    
    switch (sortField) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'vendorName':
        aValue = a.vendorName || '';
        bValue = b.vendorName || '';
        break;
      case 'position':
        aValue = a.position || '';
        bValue = b.position || '';
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }
    
    const comparison = aValue.localeCompare(bValue);
    return sortOrder === 'asc' ? comparison : -comparison;
  }) || [];

  const handleExportPDF = () => {
    try {
      const pdf = exportRepresentativesToPDF(sortedRepresentatives, vendors, sortField, sortOrder);
      const fileName = `lowespro-representatives-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF Generated",
        description: `Representatives list exported successfully as ${fileName}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed", 
        description: "Unable to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleMailingList = () => {
    setMailingListMode(!mailingListMode);
    setSelectedReps(new Set());
  };

  const handleSelectRep = (repId: string) => {
    const newSelected = new Set(selectedReps);
    if (newSelected.has(repId)) {
      newSelected.delete(repId);
    } else {
      newSelected.add(repId);
    }
    setSelectedReps(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedReps.size === (representatives?.length || 0)) {
      setSelectedReps(new Set());
    } else {
      setSelectedReps(new Set((representatives || []).map(rep => rep.id)));
    }
  };

  const exportMailingList = () => {
    if (selectedReps.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one representative for the mailing list.",
        variant: "destructive",
      });
      return;
    }

    const selectedRepresentatives = (representatives || []).filter(rep => 
      selectedReps.has(rep.id)
    );

    // Create CSV content for Outlook contact import
    const csvHeaders = [
      'First Name',
      'Last Name', 
      'E-mail Address',
      'Business Phone',
      'Mobile Phone',
      'Company',
      'Job Title',
      'Notes'
    ];

    const csvRows = selectedRepresentatives.map(rep => {
      const [firstName = '', lastName = ''] = (rep.name || '').split(' ', 2);
      const vendor = vendors.find(v => v.id === rep.vendorId);
      
      return [
        firstName,
        lastName || rep.name, // Use full name as last name if no space found
        rep.email || '',
        '', // Business Phone (we don't have this field)
        rep.cellPhone || '',
        vendor?.companyName || rep.vendorName || '',
        rep.position || '',
        `Vendor Representative - ID: ${rep.id}`
      ].map(field => `"${field.replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `lowespro-mailing-list-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Mailing List Exported",
      description: `${selectedReps.size} contacts exported as CSV for Outlook import.`,
    });

    // Reset mailing list mode
    setMailingListMode(false);
    setSelectedReps(new Set());
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Representatives</h1>
          <p className="text-gray-600 mt-1">Manage vendor sales contacts</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button variant="outline" className="font-medium" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button 
            variant={mailingListMode ? "destructive" : "outline"}
            className="font-medium"
            onClick={handleToggleMailingList}
          >
            {mailingListMode ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Cancel Mailing List
              </>
            ) : (
              <>
                <MailIcon className="mr-2 h-4 w-4" />
                Create Mailing List
              </>
            )}
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 font-medium"
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Representative
          </Button>
        </div>
      </div>

      {/* Mobile Sort Control */}
      <div className="block md:hidden">
        <Card className="construction-shadow">
          <CardContent className="p-4">
            <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortField(field);
              setSortOrder(order as 'asc' | 'desc');
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="vendorName-asc">Vendor Company (A-Z)</SelectItem>
                <SelectItem value="vendorName-desc">Vendor Company (Z-A)</SelectItem>
                <SelectItem value="position-asc">Position (A-Z)</SelectItem>
                <SelectItem value="position-desc">Position (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <Card className="construction-shadow">
          <CardContent className="p-6 space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[300px]" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : representatives && representatives.length > 0 ? (
        <>
          {/* Mobile Card Layout */}
          <div className="block md:hidden space-y-4">
            {sortedRepresentatives.map((rep) => (
              <Card 
                key={rep.id} 
                className="construction-shadow cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedRepresentative(rep);
                  setShowEditModal(true);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {mailingListMode && (
                      <div className="flex-shrink-0 mt-1">
                        <Checkbox
                          checked={selectedReps.has(rep.id)}
                          onCheckedChange={() => handleSelectRep(rep.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="text-green-600 h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">{rep.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">{rep.vendorName}</p>
                      
                      {/* Contact Info */}
                      <div className="space-y-1 mb-3">
                        {rep.cellPhone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900">
                              {formatPhoneNumber(rep.cellPhone)}
                              {rep.cellPhoneExtension && ` ext. ${rep.cellPhoneExtension}`}
                            </span>
                          </div>
                        )}
                        {rep.email && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-blue-600 break-all">{rep.email}</span>
                          </div>
                        )}
                        {!rep.cellPhone && !rep.email && (
                          <p className="text-sm text-gray-400 italic">No contact info</p>
                        )}
                      </div>

                      {/* Position */}
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                        {rep.position || "Sales Representative"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <Card className="construction-shadow overflow-hidden hidden md:block">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Sales Representatives Directory</h3>
                <span className="text-sm text-gray-500">{sortedRepresentatives?.length || 0} representatives</span>
              </div>
            </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {mailingListMode && (
                    <TableHead className="px-6 py-4 w-16">
                      <Checkbox
                        checked={selectedReps.size === (representatives?.length || 0) && representatives.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all representatives"
                      />
                    </TableHead>
                  )}
                  <TableHead className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-semibold text-gray-900">Representative</span>
                      <ArrowUpDown 
                        className="h-3 w-3 text-gray-400 cursor-pointer hover:text-gray-600" 
                        onClick={() => handleSort('name')}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-semibold text-gray-900">Vendor</span>
                      <ArrowUpDown 
                        className="h-3 w-3 text-gray-400 cursor-pointer hover:text-gray-600" 
                        onClick={() => handleSort('vendorName')}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">Contact Information</span>
                  </TableHead>
                  <TableHead className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-semibold text-gray-900">Position</span>
                      <ArrowUpDown 
                        className="h-3 w-3 text-gray-400 cursor-pointer hover:text-gray-600" 
                        onClick={() => handleSort('position')}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRepresentatives.map((rep) => (
                  <TableRow key={rep.id} className="hover:bg-gray-50 transition-colors">
                    {mailingListMode && (
                      <TableCell className="px-6 py-4">
                        <Checkbox
                          checked={selectedReps.has(rep.id)}
                          onCheckedChange={() => handleSelectRep(rep.id)}
                          aria-label={`Select ${rep.name}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <User className="text-green-600 h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{rep.name}</p>
                          <p className="text-sm text-gray-500">Sales Representative</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{rep.vendorName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="space-y-1">
                        {rep.cellPhone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900">
                              {formatPhoneNumber(rep.cellPhone)}
                              {rep.cellPhoneExtension && ` ext. ${rep.cellPhoneExtension}`}
                            </span>
                          </div>
                        )}
                        {rep.email && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900">{rep.email}</span>
                          </div>
                        )}
                        {!rep.cellPhone && !rep.email && (
                          <span className="text-gray-400 italic text-sm">No contact info</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {rep.position || "Sales Representative"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {!mailingListMode && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-gray-100"
                          onClick={() => {
                            setSelectedRepresentative(rep);
                            setShowEditModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Mailing List Submit Button */}
          {mailingListMode && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedReps.size === 0 ? (
                    "Select representatives to include in the mailing list"
                  ) : (
                    `${selectedReps.size} representative${selectedReps.size === 1 ? '' : 's'} selected`
                  )}
                </div>
                <Button 
                  onClick={exportMailingList}
                  disabled={selectedReps.size === 0}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Mailing List
                </Button>
              </div>
            </div>
          )}
        </Card>
        </>
      ) : (
        /* Empty State */
        <Card className="construction-shadow">
          <CardContent className="p-12 text-center">
            <img 
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200" 
              alt="Business meeting with materials" 
              className="mx-auto mb-6 rounded-lg opacity-75 w-72 h-48 object-cover"
            />
            <div className="max-w-sm mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sales Representatives</h3>
              <p className="text-gray-500 mb-6">Start by adding your first sales representative to track vendor contacts and relationships.</p>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 font-medium"
                onClick={() => setShowAddModal(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add First Representative
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AddRepresentativeModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />

      <EditRepresentativeModal 
        representative={selectedRepresentative}
        isOpen={showEditModal} 
        onClose={() => {
          setShowEditModal(false);
          setSelectedRepresentative(null);
        }} 
      />
    </div>
  );
}
