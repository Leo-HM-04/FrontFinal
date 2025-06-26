import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export function Card({ children, className = '', hover = false, gradient = false }: CardProps) {
  const baseClasses = 'bg-white rounded-lg shadow transition-all duration-300';
  const hoverClasses = hover ? 'hover:shadow-blue-lg hover:-translate-y-1 cursor-pointer' : '';
  const gradientClasses = gradient ? 'bg-gradient-to-br from-primary-blue-50 to-secondary-blue-50 border border-primary-blue-100' : '';
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${gradientClasses} ${className}`}>
      {children}
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export function StatsCard({ title, value, icon, trend, color = 'blue' }: StatsCardProps) {
  const colorClasses = {
    blue: 'from-primary-blue-50 to-secondary-blue-50 border-primary-blue-100',
    green: 'from-green-50 to-emerald-50 border-green-100',
    yellow: 'from-yellow-50 to-amber-50 border-yellow-100',
    red: 'from-red-50 to-pink-50 border-red-100',
  };

  const iconColorClasses = {
    blue: 'text-primary-blue',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  };

  return (
    <Card className={`p-6 bg-gradient-to-br ${colorClasses[color]} border animate-fade-in`} hover>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-primary-dark">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span className={trend.isPositive ? '↗' : '↘'}>
                {Math.abs(trend.value)}%
              </span>
              <span className="ml-1 text-gray-500">vs mes anterior</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-white shadow-sm ${iconColorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
