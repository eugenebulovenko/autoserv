import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  LabelList,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoIcon } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatNumber, formatCurrency } from "@/lib/utils";

interface ChartProps {
  data: any[];
  type: "bar" | "line" | "pie" | "area";
  title: string;
  description?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  dataKey?: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  emptyStateMessage?: string;
  showLabels?: boolean;
  stacked?: boolean;
  secondaryDataKey?: string;
  height?: number;
}

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8",
  "#82ca9d", "#ffc658", "#8dd1e1", "#a4de6c", "#d0ed57"
];

const ReportCharts = ({
  data,
  type,
  title,
  description,
  xAxisKey = "name",
  yAxisKey = "value",
  dataKey = "value",
  colors = COLORS,
  valueFormatter = (value: number) => value.toString(),
  emptyStateMessage = "Нет данных для отображения",
  showLabels = false,
  stacked = false,
  secondaryDataKey,
  height = 400
}: ChartProps) => {
  // Формат для подсказок в графиках
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {valueFormatter(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Проверка на пустые данные
  const isEmpty = !data || data.length === 0 || data.every(item => item[dataKey] === 0);

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <InfoIcon className="w-12 h-12 mb-2" />
      <p>{emptyStateMessage}</p>
    </div>
  );

  const renderChart = () => {
    if (isEmpty) return renderEmptyState();

    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} barSize={stacked ? 20 : 40}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => valueFormatter(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey={dataKey}
                fill={colors[0]}
                stackId={stacked ? "stack" : undefined}
                radius={[4, 4, 0, 0]}
              >
                {showLabels && (
                  <LabelList
                    dataKey={dataKey}
                    position="top"
                    formatter={valueFormatter}
                  />
                )}
              </Bar>
              {secondaryDataKey && (
                <Bar
                  dataKey={secondaryDataKey}
                  fill={colors[1]}
                  stackId={stacked ? "stack" : undefined}
                  radius={[4, 4, 0, 0]}
                >
                  {showLabels && (
                    <LabelList
                      dataKey={secondaryDataKey}
                      position="top"
                      formatter={valueFormatter}
                    />
                  )}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => valueFormatter(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
              {secondaryDataKey && (
                <Line
                  type="monotone"
                  dataKey={secondaryDataKey}
                  stroke={colors[1]}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => valueFormatter(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.3}
                stackId={stacked ? "stack" : undefined}
              />
              {secondaryDataKey && (
                <Area
                  type="monotone"
                  dataKey={secondaryDataKey}
                  stroke={colors[1]}
                  fill={colors[1]}
                  fillOpacity={0.3}
                  stackId={stacked ? "stack" : undefined}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={showLabels}
                label={showLabels ? ({ name, value, percent }) =>
                  `${name}: ${valueFormatter(value)} (${(percent * 100).toFixed(0)}%)`
                : undefined}
                outerRadius={height / 3}
                innerRadius={height / 8}
                fill="#8884d8"
                dataKey={dataKey}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return renderEmptyState();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="w-full">
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCharts;