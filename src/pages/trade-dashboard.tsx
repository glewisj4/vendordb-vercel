import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  TrendingUp, 
  Users, 
  Building, 
  ArrowRight, 
  BarChart3,
  PieChart,
  Zap,
  RefreshCw,
  Timer,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTrades } from "@/hooks/use-trades";
import type { ProCustomer, Trade, Vendor } from "@shared/schema";

interface TradeActivity {
  id: string;
  tradeName: string;
  tradeDisplayName: string;
  customerCount: number;
  vendorCount: number;
  recentActivity: number;
  avgProjectValue: number;
  growth: number;
  isActive: boolean;
}

interface TradeFlow {
  fromTrade: string;
  toTrade: string;
  connectionStrength: number;
  flowType: 'collaboration' | 'referral' | 'supply_chain';
}

export default function TradeDashboard() {
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [flowDirection, setFlowDirection] = useState<'in' | 'out' | 'both'>('both');
  
  const { data: trades = [], isLoading: tradesLoading } = useTrades();
  
  const { data: proCustomers = [] } = useQuery<ProCustomer[]>({
    queryKey: ["/api/pro-customers"],
  });
  
  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  // Process trade activities
  const tradeActivities: TradeActivity[] = trades.map(trade => {
    const customerCount = proCustomers.filter(customer => 
      customer.trades && customer.trades.includes(trade.name)
    ).length;
    
    const vendorCount = vendors.filter(vendor => 
      vendor.categories && vendor.categories.some(cat => 
        cat.toLowerCase().includes(trade.name.replace('-', '').toLowerCase())
      )
    ).length;
    
    return {
      id: trade.id,
      tradeName: trade.name,
      tradeDisplayName: trade.displayName,
      customerCount,
      vendorCount,
      recentActivity: Math.floor(Math.random() * 10) + 1, // Simulated activity
      avgProjectValue: Math.floor(Math.random() * 50000) + 10000,
      growth: (Math.random() - 0.5) * 20, // -10% to +10%
      isActive: customerCount > 0 || vendorCount > 0,
    };
  }).sort((a, b) => b.customerCount - a.customerCount);

  // Generate trade flows based on common project patterns
  const generateTradeFlows = (): TradeFlow[] => {
    const flows: TradeFlow[] = [];
    const tradeConnections = {
      'general-contractor': ['electrician', 'plumber', 'roofer', 'flooring'],
      'remodeler': ['electrician', 'plumber', 'painter', 'flooring'],
      'electrician': ['general-contractor', 'hvac'],
      'plumber': ['general-contractor', 'remodeler', 'hvac'],
      'hvac': ['electrician', 'plumber'],
      'roofer': ['general-contractor'],
      'painter': ['remodeler', 'general-contractor'],
      'flooring': ['general-contractor', 'remodeler'],
      'landscaper': ['general-contractor'],
      'concrete': ['general-contractor']
    };

    Object.entries(tradeConnections).forEach(([fromTrade, connections]) => {
      connections.forEach(toTrade => {
        if (trades.some(t => t.name === fromTrade) && trades.some(t => t.name === toTrade)) {
          flows.push({
            fromTrade,
            toTrade,
            connectionStrength: Math.random() * 0.8 + 0.2,
            flowType: Math.random() > 0.6 ? 'collaboration' : 'supply_chain'
          });
        }
      });
    });

    return flows;
  };

  const tradeFlows = generateTradeFlows();

  // Animation controls
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getTradePosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI;
    const radius = 200;
    return {
      x: Math.cos(angle) * radius + 300,
      y: Math.sin(angle) * radius + 300
    };
  };

  const TradeNode = ({ activity, index, total }: { activity: TradeActivity; index: number; total: number }) => {
    const position = getTradePosition(index, total);
    const isSelected = selectedTrade === activity.tradeName;
    
    return (
      <motion.div
        className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
          isSelected ? 'z-20' : 'z-10'
        }`}
        style={{ left: position.x, top: position.y }}
        animate={{
          scale: isSelected ? 1.2 : 1,
          rotate: isAnimating ? 360 : 0,
        }}
        transition={{ 
          scale: { duration: 0.2 },
          rotate: { duration: 3, ease: "linear", repeat: Infinity }
        }}
        onClick={() => setSelectedTrade(isSelected ? null : activity.tradeName)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className={`
          relative p-4 rounded-full border-2 transition-all duration-300
          ${isSelected 
            ? 'bg-blue-500 border-blue-300 text-white shadow-lg shadow-blue-500/50' 
            : activity.isActive 
              ? 'bg-white border-green-400 text-gray-900 shadow-md'
              : 'bg-gray-100 border-gray-300 text-gray-500'
          }
        `}>
          <div className="text-center">
            <div className="text-sm font-semibold truncate w-20">
              {activity.tradeDisplayName}
            </div>
            <div className="text-xs opacity-75">
              {activity.customerCount} customers
            </div>
          </div>
          
          {activity.isActive && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
      </motion.div>
    );
  };

  const FlowLine = ({ flow }: { flow: TradeFlow }) => {
    const fromIndex = tradeActivities.findIndex(a => a.tradeName === flow.fromTrade);
    const toIndex = tradeActivities.findIndex(a => a.tradeName === flow.toTrade);
    
    if (fromIndex === -1 || toIndex === -1) return null;
    
    const fromPos = getTradePosition(fromIndex, tradeActivities.length);
    const toPos = getTradePosition(toIndex, tradeActivities.length);
    
    const shouldShow = selectedTrade === null || 
      selectedTrade === flow.fromTrade || 
      selectedTrade === flow.toTrade;
    
    if (!shouldShow) return null;
    
    return (
      <motion.line
        x1={fromPos.x}
        y1={fromPos.y}
        x2={toPos.x}
        y2={toPos.y}
        stroke={flow.flowType === 'collaboration' ? '#3b82f6' : '#10b981'}
        strokeWidth={flow.connectionStrength * 4}
        strokeOpacity={0.6}
        strokeDasharray={flow.flowType === 'referral' ? "5,5" : "none"}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      />
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trade Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Real-time visualization of trade activities and relationships
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={isAnimating ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAnimating(!isAnimating)}
          >
            <Zap className="w-4 h-4 mr-2" />
            {isAnimating ? 'Pause' : 'Animate'}
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="flow" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="flow">Trade Flow</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="flow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Interactive Trade Network
              </CardTitle>
              <CardDescription>
                Click on trades to explore connections. Lines show collaboration patterns between different trades.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-[600px] bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg overflow-hidden">
                <svg className="absolute inset-0 w-full h-full">
                  {tradeFlows.map((flow, index) => (
                    <FlowLine key={index} flow={flow} />
                  ))}
                </svg>
                
                {tradeActivities.map((activity, index) => (
                  <TradeNode 
                    key={activity.id} 
                    activity={activity} 
                    index={index} 
                    total={tradeActivities.length} 
                  />
                ))}
                
                <div className="absolute bottom-4 left-4 bg-white rounded-lg p-4 shadow-lg">
                  <h4 className="font-semibold mb-2">Legend</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-blue-500"></div>
                      <span>Collaboration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-green-500"></div>
                      <span>Supply Chain</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span>Active Trade</span>
                    </div>
                  </div>
                </div>
                
                {selectedTrade && (
                  <motion.div
                    className="absolute top-4 right-4 bg-white rounded-lg p-4 shadow-lg max-w-xs"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {(() => {
                      const activity = tradeActivities.find(a => a.tradeName === selectedTrade);
                      return activity ? (
                        <div>
                          <h4 className="font-semibold text-lg">{activity.tradeDisplayName}</h4>
                          <div className="space-y-2 mt-3 text-sm">
                            <div className="flex justify-between">
                              <span>Customers:</span>
                              <span className="font-medium">{activity.customerCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Vendors:</span>
                              <span className="font-medium">{activity.vendorCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Recent Activity:</span>
                              <span className="font-medium">{activity.recentActivity}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Avg Project:</span>
                              <span className="font-medium">
                                ${activity.avgProjectValue.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Growth:</span>
                              <span className={`font-medium ${activity.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {activity.growth >= 0 ? '+' : ''}{activity.growth.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trades.length}</div>
                <p className="text-xs text-muted-foreground">
                  {trades.filter(t => t.isDefault === "false").length} custom trades
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Trades</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tradeActivities.filter(t => t.isActive).length}</div>
                <p className="text-xs text-muted-foreground">
                  {((tradeActivities.filter(t => t.isActive).length / trades.length) * 100).toFixed(1)}% active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{proCustomers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Across all trades
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trade Connections</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tradeFlows.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active relationships
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trade Distribution</CardTitle>
              <CardDescription>Customer distribution across different trades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tradeActivities.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{activity.tradeDisplayName}</span>
                      <span className="text-muted-foreground">
                        {activity.customerCount} customers ({activity.vendorCount} vendors)
                      </span>
                    </div>
                    <Progress 
                      value={(activity.customerCount / Math.max(...tradeActivities.map(t => t.customerCount), 1)) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tradeActivities
                    .filter(t => t.isActive)
                    .slice(0, 6)
                    .map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div>
                        <div className="font-medium">{activity.tradeDisplayName}</div>
                        <div className="text-sm text-gray-500">
                          {activity.recentActivity} recent activities
                        </div>
                      </div>
                      <Badge variant={activity.growth >= 0 ? "default" : "destructive"}>
                        {activity.growth >= 0 ? '+' : ''}{activity.growth.toFixed(1)}%
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-800">Most Active Trade</div>
                    <div className="text-sm text-green-600">
                      {tradeActivities.filter(t => t.isActive)[0]?.tradeDisplayName || 'None'} with{' '}
                      {tradeActivities.filter(t => t.isActive)[0]?.customerCount || 0} customers
                    </div>
                  </div>
                  
                  <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-800">Highest Growth</div>
                    <div className="text-sm text-blue-600">
                      {tradeActivities.reduce((max, current) => 
                        current.growth > max.growth ? current : max, tradeActivities[0]
                      )?.tradeDisplayName || 'None'} at{' '}
                      {tradeActivities.reduce((max, current) => 
                        current.growth > max.growth ? current : max, tradeActivities[0]
                      )?.growth.toFixed(1) || 0}%
                    </div>
                  </div>
                  
                  <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="font-medium text-yellow-800">Opportunity</div>
                    <div className="text-sm text-yellow-600">
                      {trades.filter(t => !tradeActivities.find(a => a.tradeName === t.name)?.isActive).length} trades with no customers yet
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}