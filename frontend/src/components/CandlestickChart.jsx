import { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';

ChartJS.register(
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement
);

const CandlestickChart = ({ data, loading }) => {
  const chartRef = useRef(null);

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  // Transform history data to OHLC format
  const ohlcData = data.map((item, index) => {
    const price = parseFloat(item.priceUsd || 0);
    if (isNaN(price) || price <= 0) return null;
    
    // Generate OHLC from price data (simulate candlestick with realistic variation)
    const variation = price * 0.015; // 1.5% variation
    const open = index > 0 ? parseFloat(data[index - 1].priceUsd || price) : price;
    
    if (isNaN(open) || open <= 0) return null;
    
    // Create realistic high/low based on price movement
    const priceChange = price - open;
    const isUp = priceChange >= 0;
    const high = isUp 
      ? price + (variation * 0.3) 
      : open + (variation * 0.2);
    const low = isUp 
      ? open - (variation * 0.2)
      : price - (variation * 0.3);
    const close = price;

    return {
      x: index, // Use index instead of time for simpler category scale
      o: Math.max(0, open),
      h: Math.max(open, high, close, low),
      l: Math.min(open, high, close, low),
      c: Math.max(0, close),
    };
  }).filter(Boolean);

  // Generate labels for x-axis
  const labels = data.map((item, index) => {
    if (!item.time) return `Point ${index + 1}`;
    const date = new Date(item.time);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
  });

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Price',
        data: ohlcData,
        color: {
          up: '#26a69a', // Binance green
          down: '#ef5350', // Binance red
          unchanged: '#999',
        },
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(20, 23, 26, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          title: function(context) {
            return labels[context[0].dataIndex] || '';
          },
          label: function(context) {
            const point = context.raw;
            if (!point || typeof point !== 'object') return '';
            return [
              `Open: $${point.o?.toFixed(2) || '0.00'}`,
              `High: $${point.h?.toFixed(2) || '0.00'}`,
              `Low: $${point.l?.toFixed(2) || '0.00'}`,
              `Close: $${point.c?.toFixed(2) || '0.00'}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        type: 'category',
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.4)',
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 0,
          maxTicksLimit: 12,
        },
      },
      y: {
        position: 'right',
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: 12,
            weight: '500',
          },
          callback: function(value) {
            const num = parseFloat(value);
            if (isNaN(num)) return '$0.00';
            if (num < 0.01) return '$' + num.toFixed(4);
            if (num < 1) return '$' + num.toFixed(3);
            if (num < 1000) return '$' + num.toFixed(2);
            return '$' + (num / 1000).toFixed(2) + 'K';
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  if (loading || !data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[#14171A] rounded-lg border border-[#1E2329]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F0B90B] mb-4"></div>
          <div className="text-white/60">Loading chart data...</div>
        </div>
      </div>
    );
  }

  if (ohlcData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[#14171A] rounded-lg border border-[#1E2329]">
        <div className="text-center">
          <div className="text-white/60">No chart data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#14171A] rounded-lg p-3 sm:p-4 border border-[#1E2329] relative">
      <Chart
        ref={chartRef}
        type="candlestick"
        data={chartData}
        options={chartOptions}
        key={`chart-${data.length}`} // Force re-render when data changes
      />
    </div>
  );
};

export default CandlestickChart;
