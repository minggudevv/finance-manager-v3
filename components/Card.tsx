interface CardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function Card({ title, value, icon, trend, className = '' }: CardProps) {
  const colors: Record<string, string> = {
    income: 'bg-green-50 border-green-200 text-green-700',
    expense: 'bg-red-50 border-red-200 text-red-700',
    debt: 'bg-orange-50 border-orange-200 text-orange-700',
    receivable: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className} ${colors[className] || ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className="text-gray-400 dark:text-gray-500">{icon}</div>
      </div>
    </div>
  );
}
