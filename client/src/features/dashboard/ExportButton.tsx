import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, FileText, Table, Loader } from "lucide-react";
import { toast } from "react-toastify";
import { useUser } from "../../store/auth.store";
import type { DashboardScan, ExportData } from "../../types";

interface ExportButtonProps {
  data?: DashboardScan[];
  className?: string;
}

const ExportButton = ({
  data = [],
  className = "",
}: ExportButtonProps) => {
  const user = useUser();
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const generateCSV = (exportData: ExportData): string => {
    const headers = [
      "Date",
      "Food Item",
      "Confidence",
      "Calories",
      "Health Condition",
      "Risk Level",
    ];

    const rows = exportData.scans.map((scan) => [
      new Date(scan.scanned_at).toLocaleDateString(),
      scan.food_name,
      `${Math.round(scan.confidence * 100)}%`,
      scan.calories,
      scan.health_condition,
      scan.risk_level,
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  };

  const generatePDF = async (exportData: ExportData): Promise<void> => {
    // In a real app, you'd use a library like jsPDF or call a backend service
    const content = `
      SnapFood Nutrition Report
      User: ${exportData.user.name}
      Health Condition: ${exportData.scans[0]?.health_condition ?? "Not recorded"}
      Date Range: ${exportData.dateRange.start} to ${exportData.dateRange.end}
      
      Summary:
      - Total Scans: ${exportData.stats.totalScans}
      - Average Calories: ${exportData.stats.averageCalories}
      - Low-Risk Scan Rate: ${exportData.stats.healthScore}%
      
      Recent Meals:
      ${exportData.scans.length
        ? exportData.scans
            .map(
              (scan) => `
        ${new Date(scan.scanned_at).toLocaleDateString()} - ${scan.food_name}
        Calories: ${scan.calories}, Confidence: ${Math.round(scan.confidence * 100)}%
        Health Condition: ${scan.health_condition}, Risk Level: ${scan.risk_level}
      `,
            )
            .join("\n")
        : "No recent meals available."}
    `;

    // Create a simple text file for demo purposes
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snapfood-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: "pdf" | "csv") => {
    if (!user) return;

    setIsExporting(true);
    setShowOptions(false);

    try {
      const caloriesTotal = data.reduce((total, scan) => total + scan.calories, 0);
      const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const foodCounts = data.reduce<Record<string, number>>((counts, scan) => {
        counts[scan.food_name] = (counts[scan.food_name] ?? 0) + 1;
        return counts;
      }, {});

      const exportData: ExportData = {
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
        },
        scans: data,
        stats: {
          totalScans: data.length,
          weeklyScans: data.filter(
            (scan) => new Date(scan.scanned_at).getTime() >= weekStart,
          ).length,
          averageCalories: data.length
            ? Math.round(caloriesTotal / data.length)
            : 0,
          topFoods: Object.entries(foodCounts)
            .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
            .slice(0, 3)
            .map(([foodName]) => foodName),
          healthScore: data.length
            ? Math.round(
                (data.filter((scan) => scan.risk_level === "low").length /
                  data.length) *
                  100,
              )
            : 0,
        },
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      };

      if (format === "csv") {
        const csvContent = generateCSV(exportData);
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `snapfood-data-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        await generatePDF(exportData);
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isExporting}
        className={`flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isExporting ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span>{isExporting ? "Exporting..." : t("exportReport")}</span>
      </button>

      {showOptions && !isExporting && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
            <div className="py-1">
              <button
                onClick={() => handleExport("pdf")}
                className="w-full flex items-center space-x-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <FileText className="h-4 w-4 text-red-500" />
                <span>{t("downloadPDF")}</span>
              </button>
              <button
                onClick={() => handleExport("csv")}
                className="w-full flex items-center space-x-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Table className="h-4 w-4 text-green-500" />
                <span>{t("downloadCSV")}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
