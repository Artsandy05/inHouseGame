// src/pages/AdminReports.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Select,
  FormControl,
  InputLabel,
  Divider,
  IconButton,
  Tooltip,
  Chip,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Avatar,
  useTheme,
  TableSortLabel,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  InputAdornment,
  Fade,
  Fab
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en';
import {
  Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon,
  GridOn as ExcelIcon,
  BarChart as ChartIcon,
  FilterAlt as FilterIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  AttachMoney as MoneyIcon,
  Casino as CasinoIcon,
  Receipt as ReceiptIcon,
  FilterAltRounded,
  AttachMoney,
  CalendarToday,
  EventAvailable,
  FilterList,
  CheckCircleOutline,
  Diamond,
  Egg,
  PictureAsPdf,
  Description,
  Add,
  Wallet
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import api from '../../services/api';
import { visuallyHidden } from '@mui/utils';
import autoTable from 'jspdf-autotable';

// Enhanced Types
type JackpotType = 'mini' | 'minor' | 'major' | 'grand';
type TransactionType = 'bet' | 'payout';
type DateRangePreset = 'today' | 'yesterday' | '7days' | '30days' | 'month' | 'lastmonth' | 'custom';

interface JackpotLog {
  id: number;
  userId: number;
  firstName: string;
  amount: number;
  type: 'mini' | 'minor' | 'major' | 'grand';
  gameRoundId?: string;
  createdAt: string;
}

interface Prize {
  id: number;
  type: string;
  amount: number;
  count: number;
  probability: number;
  createdAt: string;
}

interface Egg {
  id: number;
  item: string;
  color: string;
  cracked: boolean;
  scratched: boolean;
  textShadow: string;
  showCracked: boolean;
}

interface GameRound {
  id: number;
  user_id: number;
  firstName: string;
  result: string;
  winning_amount: number;
  jackpot_amount: number;
  jackpot_type: string | null;
  transaction_number: string;
  game_id: string;
  round_id: string;
  crack_count: number;
  eggs: Egg[];
  bet_amount: number;
  payout_ratio: number;
  createdAt: string;
}

interface Transaction {
  id: number;
  user_id: number;
  firstName: string;
  game_id: string;
  round_id: string;
  transaction_number: string;
  amount: number;
  type: 'bet' | 'payout';
  previous_balance: number;
  balance_after: number;
  createdAt: string;
}

interface SummaryData {
  totalBets: number;
  totalPayouts: number;
  totalJackpots: number;
  totalRounds: number;
  activePlayers: number;
  highestWin: number;
  biggestJackpot: number;
  averageBet: number;
  payoutRatio: number;
  jackpotBreakdown: Record<'mini' | 'minor' | 'major' | 'grand', number>;
}

interface Column {
  id: string;
  label: string;
  align?: 'right' | 'left' | 'center';
  sortable?: boolean;
  format?: (value: any) => string | React.ReactNode;
  width?: string;
}

type Order = 'asc' | 'desc';

const AdminReports = () => {
  const theme = useTheme();
  
  // Date states
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(7, 'day'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [dateRange, setDateRange] = useState<DateRangePreset>('7days');

  // Data states
  const [jackpotLogs, setJackpotLogs] = useState<JackpotLog[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [rounds, setRounds] = useState<GameRound[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // UI states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState(0);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<string>('createdAt');
  const [searchTerm, setSearchTerm] = useState('');
  const [openFilters, setOpenFilters] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'excel' | ''>('');
  const [exportInProgress, setExportInProgress] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Filters
  const [jackpotFilter, setJackpotFilter] = useState<JackpotType | 'all'>('all');
  const [transactionFilter, setTransactionFilter] = useState<TransactionType | 'all'>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'lose'>('all');
  const [minAmountFilter, setMinAmountFilter] = useState<number | ''>('');
  const [maxAmountFilter, setMaxAmountFilter] = useState<number | ''>('');
  const [showEggDetails, setShowEggDetails] = useState(false);

  // Enhanced column definitions
  const jackpotColumns: Column[] = [
    { id: 'createdAt', label: 'Date', sortable: true, format: formatDate, width: '180px' },
    { id: 'firstName', label: 'Player', sortable: true },
    { id: 'type', label: 'Type', sortable: true, format: (type: JackpotType) => (
      <Chip 
        label={type.toUpperCase()} 
        color={
          type === 'grand' ? 'error' : 
          type === 'major' ? 'warning' : 
          type === 'minor' ? 'info' : 'success'
        }
        size="small"
        variant="outlined"
      />
    )},
    { id: 'amount', label: 'Amount', align: 'right', sortable: true, format: formatCurrency },
    { id: 'gameRoundId', label: 'Round ID', sortable: true }
  ];

  const roundColumns: Column[] = [
    { id: 'createdAt', label: 'Date', sortable: true, format: formatDate, width: '180px' },
    { id: 'firstName', label: 'Player', sortable: true },
    { id: 'round_id', label: 'Round ID', sortable: true },
    { id: 'bet_amount', label: 'Bet', align: 'right', sortable: true, format: (amount: number) => formatCurrency(amount || 0) },
    { id: 'result', label: 'Result', format: (result: string) => (
      <Box display="flex" alignItems="center">
        {result === 'Win' ? (
          <ArrowUpwardIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
        ) : (
          <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5, color:'pink' }} />
        )}
        <Typography color={result === 'Win' ? 'success.main' : 'pink'}>
          {result.toUpperCase()}
        </Typography>
      </Box>
    )},
    { id: 'winning_amount', label: 'Win Amount', align: 'right', sortable: true, format: formatCurrency },
    // { id: 'payout_ratio', label: 'Payout', align: 'right', format: (ratio: number) => `${(ratio * 100).toFixed(2)}%` },
    { id: 'jackpot_type', label: 'Jackpot', format: (type: JackpotType | null) => type ? (
      <Chip 
        label={type.toUpperCase()} 
        color={
          type === 'grand' ? 'error' : 
          type === 'major' ? 'warning' : 
          type === 'minor' ? 'info' : 'success'
        }
        size="small"
        variant="outlined"
      />
    ) : '-'},
    { id: 'jackpot_amount', label: 'Jackpot Amount', align: 'right', sortable: true, format: (amount: number) => amount > 0 ? formatCurrency(amount) : '-' },
    { id: 'crack_count', label: 'Cracks', align: 'center' }
  ];

  const transactionColumns: Column[] = [
    { id: 'createdAt', label: 'Date', sortable: true, format: formatDate, width: '180px' },
    { id: 'firstName', label: 'Player', sortable: true },
    { id: 'type', label: 'Type', sortable: true, format: (type: TransactionType) => (
      <Chip 
        label={type.toUpperCase()} 
        color={type === 'payout' ? 'success' : 'primary'} 
        variant="outlined"
        size="small"
      />
    )},
    { id: 'amount', label: 'Amount', align: 'right', sortable: true, format: formatCurrency },
    // { id: 'previous_balance', label: 'Previous', align: 'right', format: formatCurrency },
    // { id: 'balance_after', label: 'New Balance', align: 'right', format: formatCurrency },
    { id: 'round_id', label: 'Round ID', sortable: true },
    { id: 'transaction_number', label: 'Reference #', sortable: true }
  ];

  // Format currency
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Format date
  function formatDate(dateString: string) {
    return dayjs(dateString).format('MMM D, YYYY h:mm A');
  }

  // Calculate net revenue
  const calculateNetRevenue = useCallback(() => {
    if (!summary) return 0;
    return summary.totalBets - summary.totalPayouts - summary.totalJackpots;
  }, [summary]);

  // Enhanced data fetching with error handling
  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const start = startDate?.format('YYYY-MM-DD');
      const end = endDate?.format('YYYY-MM-DD');
      const apiKey = process.env.REACT_APP_API_KEY;
  
      if (!start || !end) {
        throw new Error('Invalid date range');
      }
  
      const [logsRes, prizesRes, roundsRes, transactionsRes, summaryRes] = await Promise.all([
        api.get<{ success: boolean; data: JackpotLog[] }>(`/in-house-games/golden-goose/jackpot-logs?start=${start}&end=${end}`, {
          headers: { 'x-api-key': apiKey }
        }),
        api.get<{ success: boolean; data: Prize[] }>('/in-house-games/golden-goose/prizes', {
          headers: { 'x-api-key': apiKey }
        }),
        api.get<{ success: boolean; data: GameRound[] }>(`/in-house-games/golden-goose/rounds?start=${start}&end=${end}`, {
          headers: { 'x-api-key': apiKey }
        }),
        api.get<{ success: boolean; data: Transaction[] }>(`/in-house-games/golden-goose/transactions?start=${start}&end=${end}`, {
          headers: { 'x-api-key': apiKey }
        }),
        api.get<{ success: boolean; data: SummaryData }>(`/in-house-games/golden-goose/summary?start=${start}&end=${end}`, {
          headers: { 'x-api-key': apiKey }
        })
      ]);
  
      // Make sure our data is valid before setting state
      if (!logsRes.data.success || !prizesRes.data.success || !roundsRes.data.success || 
          !transactionsRes.data.success || !summaryRes.data.success) {
        throw new Error('One or more API requests failed');
      }
  
      setJackpotLogs(logsRes.data.data);
      setPrizes(prizesRes.data.data);
      
      // Process rounds - ensure bet_amount and payout_ratio are calculated properly
      setRounds(roundsRes.data.data.map(round => ({
        ...round,
        bet_amount: typeof round.bet_amount === 'number' ? round.bet_amount : 0,
        payout_ratio: round.winning_amount / (typeof round.bet_amount === 'number' && round.bet_amount > 0 ? round.bet_amount : 1)
      })));
      
      // Process transactions - ensure balance calculations are handled correctly
      setTransactions(transactionsRes.data.data.map(tx => {
        // If balance_after is already provided, use it; otherwise calculate
        const balanceAfter = typeof tx.balance_after === 'number' ? tx.balance_after : 0;
        // Calculate previous balance based on transaction type and amount
        const previousBalance = typeof tx.previous_balance === 'number' ? 
          tx.previous_balance : 
          balanceAfter - (tx.type === 'payout' ? tx.amount : -tx.amount);
        
        return {
          ...tx,
          balance_after: balanceAfter,
          previous_balance: previousBalance
        };
      }));
      
      setSummary(summaryRes.data.data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Handle date range change
  const handleDateRangeChange = (range: DateRangePreset) => {
    setDateRange(range);
    const today = dayjs();
    
    switch (range) {
      case 'today':
        setStartDate(today.startOf('day'));
        setEndDate(today.endOf('day'));
        break;
      case 'yesterday':
        setStartDate(today.subtract(1, 'day').startOf('day'));
        setEndDate(today.subtract(1, 'day').endOf('day'));
        break;
      case '7days':
        setStartDate(today.subtract(7, 'day').startOf('day'));
        setEndDate(today.endOf('day'));
        break;
      case '30days':
        setStartDate(today.subtract(30, 'day').startOf('day'));
        setEndDate(today.endOf('day'));
        break;
      case 'month':
        setStartDate(today.startOf('month'));
        setEndDate(today.endOf('month'));
        break;
      case 'lastmonth':
        setStartDate(today.subtract(1, 'month').startOf('month'));
        setEndDate(today.subtract(1, 'month').endOf('month'));
        break;
      default:
        break;
    }
  };

  // Handle sort request
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Apply sorting to data
  function getSortedData<T>(data: T[], comparator: (a: T, b: T) => number) {
    return data.slice().sort(comparator);
  }

  // Comparator function for sorting
  function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }

  function getComparator<Key extends keyof any>(
    order: Order,
    orderBy: Key
  ): (a: { [key in Key]: any }, b: { [key in Key]: any }) => number {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  // Apply filters to data
  const filteredJackpotLogs = jackpotLogs.filter(log => {
    const matchesType = jackpotFilter === 'all' || log.type === jackpotFilter;
    const matchesSearch = searchTerm === '' || 
      log.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (log.gameRoundId && log.gameRoundId.includes(searchTerm));
    const matchesMinAmount = minAmountFilter === '' || log.amount >= minAmountFilter;
    const matchesMaxAmount = maxAmountFilter === '' || log.amount <= maxAmountFilter;
    
    return matchesType && matchesSearch && matchesMinAmount && matchesMaxAmount;
  });

  const filteredRounds = rounds.filter(round => {
    const matchesResult = resultFilter === 'all' || round.result === resultFilter;
    const matchesSearch = searchTerm === '' || 
      round.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      round.round_id.includes(searchTerm);
    const matchesMinAmount = minAmountFilter === '' || (round.bet_amount || 0) >= minAmountFilter;
    const matchesMaxAmount = maxAmountFilter === '' || (round.bet_amount || 0) <= maxAmountFilter;
    
    return matchesResult && matchesSearch && matchesMinAmount && matchesMaxAmount;
  });

  const filteredTransactions = transactions.filter(tx => {
    const matchesType = transactionFilter === 'all' || tx.type === transactionFilter;
    const matchesSearch = searchTerm === '' || 
      tx.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tx.transaction_number.includes(searchTerm) ||
      tx.round_id.includes(searchTerm);
    const matchesMinAmount = minAmountFilter === '' || tx.amount >= minAmountFilter;
    const matchesMaxAmount = maxAmountFilter === '' || tx.amount <= maxAmountFilter;
    
    return matchesType && matchesSearch && matchesMinAmount && matchesMaxAmount;
  });

  // Get sorted and paginated data
  const sortedJackpotLogs = getSortedData(filteredJackpotLogs, getComparator(order, orderBy))
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const sortedRounds = getSortedData(filteredRounds, getComparator(order, orderBy))
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const sortedTransactions = getSortedData(filteredTransactions, getComparator(order, orderBy))
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(0);
  };

  // Export to Excel
  const exportToExcel = async () => {
    setExportInProgress(true);
    try {
      const XLSX = await import('xlsx');
      let dataToExport: any[] = [];
      let fileName = '';
  
      switch (activeTab) {
        case 0: // Jackpot Logs
          dataToExport = filteredJackpotLogs.map(log => ({
            Date: formatDate(log.createdAt),
            Player: log.firstName,
            Type: log.type.toUpperCase(),
            'Amount (₱)': log.amount,
            'Round ID': log.gameRoundId || 'N/A'
          }));
          fileName = `Jackpot_Logs_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
          break;
        case 1: // Game Rounds
          dataToExport = filteredRounds.map(round => ({
            Date: formatDate(round.createdAt),
            Player: round.firstName,
            'Round ID': round.round_id,
            'Bet (₱)': round.bet_amount || 0,
            Result: round.result.toUpperCase(),
            'Win Amount (₱)': round.winning_amount,
            'Jackpot Amount (₱)': round.jackpot_amount > 0 ? round.jackpot_amount : '-',
            'Jackpot Type': round.jackpot_type ? round.jackpot_type.toUpperCase() : '-',
            'Crack Count': round.crack_count,
            'Eggs': round.eggs.map(egg => egg.item).join(', ')
          }));
          fileName = `Game_Rounds_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
          break;
        case 2: // Transactions
          dataToExport = filteredTransactions.map(tx => ({
            Date: formatDate(tx.createdAt),
            Player: tx.firstName,
            Type: tx.type.toUpperCase(),
            'Amount (₱)': tx.amount,
            'Reference #': tx.transaction_number
          }));
          fileName = `Transactions_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
          break;
      }
  
      // Create worksheet with auto column width
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      
      // Auto-size columns
      const wscols = Object.keys(dataToExport[0]).map(() => ({ wch: 20 }));
      ws['!cols'] = wscols;
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, fileName);
      setExportSuccess(true);
    } catch (err) {
      console.error('Excel export error:', err);
      setError('Failed to generate Excel file. Please try again.');
    } finally {
      setExportInProgress(false);
      setExportDialogOpen(false);
    }
  };
  
  const exportToPDF = () => {
    setExportInProgress(true);
    try {
      const doc = new jsPDF();
      let dataToExport: any[] = [];
      let headers: string[] = [];
      let title = '';
  
      // Set document metadata
      doc.setProperties({
        title: 'Golden Goose Report',
        subject: 'Exported Report Data',
        author: 'Golden Goose System',
        keywords: 'report, export, data',
        creator: 'Golden Goose Web App'
      });
  
      // Set styles for header
      doc.setFontSize(18);
      doc.setTextColor(26, 32, 53); // #1a2035
      doc.setFont('helvetica', 'bold');
      
      switch (activeTab) {
        case 0: // Jackpot Logs
          title = 'JACKPOT LOGS REPORT';
          headers = ['Date', 'Player', 'Type', 'Amount (₱)', 'Round ID'];
          dataToExport = filteredJackpotLogs.map(log => [
            formatDate(log.createdAt),
            log.firstName,
            log.type.toUpperCase(),
            formatCurrency(log.amount),
            log.gameRoundId || 'N/A'
          ]);
          break;
        case 1: // Game Rounds
          title = 'GAME ROUNDS REPORT';
          headers = ['Date', 'Player', 'Round ID', 'Bet (₱)', 'Result', 
                    'Win Amount (₱)', 'Jackpot Type', 'Cracks'];
          dataToExport = filteredRounds.map(round => [
            formatDate(round.createdAt),
            round.firstName,
            round.round_id,
            formatCurrency(round.bet_amount || 0),
            round.result.toUpperCase(),
            formatCurrency(round.winning_amount),
            round.jackpot_type ? round.jackpot_type.toUpperCase() : '-',
            round.crack_count
          ]);
          break;
        case 2: // Transactions
          title = 'TRANSACTIONS REPORT';
          headers = ['Date', 'Player', 'Type', 'Amount (₱)', 'Reference #'];
          dataToExport = filteredTransactions.map(tx => [
            formatDate(tx.createdAt),
            tx.firstName,
            tx.type.toUpperCase(),
            formatCurrency(tx.amount),
            tx.transaction_number
          ]);
          break;
      }
  
      // Add title and date range
      doc.text(title, 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(139, 0, 0); // Maroon
      doc.text(`Date Range: ${startDate?.format('MMM D, YYYY')} - ${endDate?.format('MMM D, YYYY')}`, 14, 28);
      doc.text(`Generated: ${dayjs().format('MMM D, YYYY h:mm A')}`, 14, 34);
  
      // Generate the table
      autoTable(doc, {
        head: [headers],
        body: dataToExport,
        startY: 40,
        theme: 'grid',
        headStyles: {
          fillColor: [26, 32, 53], // #1a2035
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 4
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: [51, 51, 51]
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        styles: {
          halign: 'center',
          valign: 'middle'
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: 25 }, // Date
          1: { halign: 'left', cellWidth: 25 }, // Player
          3: { halign: 'right', cellWidth: 20 }, // Amount columns
          5: { halign: 'right' },
          7: { halign: 'center' }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: function(data) {
          // Footer
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        }
      });
  
      // Add watermark
      doc.setFontSize(60);
      doc.setTextColor(230, 230, 230);
      doc.setFont('helvetica', 'bold');
      doc.text('GOLDEN GOOSE', 40, 120, { angle: 45 });
  
      // Save PDF
      doc.save(`${title.replace(/\s+/g, '_')}_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`);
      setExportSuccess(true);
    } catch (err) {
      console.error('PDF export error:', err);
      setError('Failed to generate PDF file. Please try again.');
    } finally {
      setExportInProgress(false);
      setExportDialogOpen(false);
    }
  };

  // Handle export confirmation
  const confirmExport = () => {
    if (exportType === 'pdf') {
      exportToPDF();
    } else if (exportType === 'excel') {
      exportToExcel();
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en">
      <Box sx={{
        p: { xs: 2, sm: 3, md: 4 },
        minHeight: 'calc(100vh - 64px)', // Adjust based on your header height
        background: 'linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%)',
        position: 'relative',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #1a2035 0%, maroon 100%)',
          zIndex: 1
        }
      }}>
        {/* Optional decorative elements */}
        <Box sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: '100px',
          height: '100px',
          background: 'radial-gradient(circle, rgba(26,32,53,0.08) 0%, rgba(255,255,255,0) 70%)',
          borderRadius: '50%',
          zIndex: 0
        }} />
        
        {/* Main content container with subtle elevation */}
        <Paper elevation={0} sx={{
          position: 'relative',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(26, 32, 53, 0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
          p: { xs: 2, sm: 3 },
          minHeight: 'calc(100vh - 128px)', // Adjust based on your needs
          '&:hover': {
            boxShadow: '0 6px 28px rgba(26, 32, 53, 0.12)'
          },
          transition: 'all 0.3s ease'
        }}>
          {/* Your page content goes here */}
          {/* Header Section */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          backgroundColor: '#1a2035', // Using your dark blue color
          color: 'white',
          p: 3,
          borderRadius: '12px',
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
          background: 'linear-gradient(135deg, #1a2035 0%, #2a3045 100%)', // Gradient effect
          borderLeft: '4px solid maroon' // Accent border
        }}>
          <Box display="flex" alignItems="center">
            <CasinoIcon sx={{ 
              fontSize: 44, 
              mr: 2,
              color: 'maroon', // Making the icon stand out
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold" sx={{
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                letterSpacing: '0.5px'
              }}>
                Golden Goose Reports
              </Typography>
              <Typography variant="subtitle1" sx={{
                opacity: 0.9,
                fontStyle: 'italic',
                mt: 0.5
              }}>
                {startDate?.format('MMM D, YYYY')} - {endDate?.format('MMM D, YYYY')}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Refresh Data">
              <IconButton 
                onClick={fetchReportData} 
                color="inherit"
                sx={{ 
                  mr: 1, 
                  backgroundColor: 'rgba(255,255,255,0.1)', 
                  '&:hover': { 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    transform: 'rotate(45deg)',
                    transition: 'transform 0.3s ease'
                  },
                  transition: 'all 0.3s ease',
                  width: 48,
                  height: 48
                }}
              >
                <RefreshIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>
            <Button 
              variant="contained" 
              startIcon={<PdfIcon />} 
              onClick={() => {
                setExportType('pdf');
                setExportDialogOpen(true);
              }}
              sx={{ 
                mr: 1,
                backgroundColor: 'maroon',
                '&:hover': { 
                  backgroundColor: '#900', // Darker maroon
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                },
                px: 3,
                py: 1,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 'bold',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}
            >
              Export PDF
            </Button>
            <Button 
              variant="contained"
              startIcon={<ExcelIcon />} 
              onClick={() => {
                setExportType('excel');
                setExportDialogOpen(true);
              }}
              sx={{
                backgroundColor: '#1a7f56', // A professional green
                '&:hover': { 
                  backgroundColor: '#0d6e47',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                },
                px: 3,
                py: 1,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 'bold',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}
            >
              Export Excel
            </Button>
          </Box>
        </Box>

        {/* Filters Section */}
        <Paper sx={{
          p: 3,
          mb: 3,
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(26, 32, 53, 0.1)',
          background: 'white',
          border: '1px solid #f0f0f0',
          position: 'relative',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            backgroundColor: 'maroon'
          }
        }}>
          {/* Main Filters Row */}
          <Grid container spacing={2} alignItems="flex-end">
            {/* Date Range Selector */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{
                  color: '#6b7280',
                  fontWeight: '500',
                  '&.Mui-focused': {
                    color: 'maroon'
                  }
                }}>
                  Date Range
                </InputLabel>
                <Select
                  value={dateRange}
                  onChange={(e) => handleDateRangeChange(e.target.value as DateRangePreset)}
                  label="Date Range"
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1.5
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e5e7eb'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#9ca3af'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'maroon',
                      borderWidth: '1px'
                    }
                  }}
                >
                  {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'Custom'].map((option) => (
                    <MenuItem 
                      key={option.toLowerCase().replace(' ', '')} 
                      value={option.toLowerCase().replace(' ', '')}
                      sx={{
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(139, 0, 0, 0.08)',
                          '&:hover': {
                            backgroundColor: 'rgba(139, 0, 0, 0.12)'
                          }
                        }
                      }}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Date Pickers with Peso-inspired Design */}
            {['Start', 'End'].map((type) => (
              <Grid item xs={12} sm={6} md={3} key={type}>
                <DatePicker
                  label={`${type} Date`}
                  value={type === 'Start' ? startDate : endDate}
                  onChange={(newValue) => {
                    type === 'Start' ? setStartDate(newValue) : setEndDate(newValue);
                    setDateRange('custom');
                  }}
                  maxDate={type === 'Start' ? endDate : dayjs()}
                  minDate={type === 'End' ? startDate : null}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: {
                        '& .MuiInputBase-root': {
                          '&:hover fieldset': { borderColor: '#9ca3af' },
                          '&.Mui-focused fieldset': { 
                            borderColor: 'maroon',
                            boxShadow: '0 0 0 2px rgba(139, 0, 0, 0.1)'
                          }
                        }
                      },
                      InputProps: {
                        startAdornment: (
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mr: 1,
                            color: 'maroon'
                          }}>
                            {type === 'Start' ? <CalendarToday fontSize="small" /> : <EventAvailable fontSize="small" />}
                          </Box>
                        )
                      }
                    }
                  }}
                />
              </Grid>
            ))}

            {/* Search Field with Filipino Touch */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search Player Name or Player ID"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'maroon' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e5e7eb'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#9ca3af'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'maroon',
                      boxShadow: '0 0 0 2px rgba(139, 0, 0, 0.1)'
                    }
                  }
                }}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: '#6b7280',
                    '&.Mui-focused': {
                      color: 'maroon'
                    }
                  }
                }}
              />
            </Grid>
          </Grid>

          {/* Advanced Filters - Pinoy Style */}
          <Accordion
            expanded={openFilters}
            onChange={() => setOpenFilters(!openFilters)}
            sx={{
              mt: 3,
              boxShadow: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: '8px !important',
              '&:before': { display: 'none' },
              '&.Mui-expanded': {
                margin: 0,
                marginTop: 3
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: 'maroon' }} />}
              sx={{
                backgroundColor: '#f9fafb',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                '&:hover': {
                  backgroundColor: '#f3f4f6'
                },
                '&.Mui-expanded': {
                  minHeight: '48px',
                  borderBottom: '1px solid #e5e7eb'
                }
              }}
            >
              <Box display="flex" alignItems="center">
                <FilterList sx={{ color: 'maroon', mr: 1.5 }} />
                <Typography variant="subtitle1" sx={{
                  color: '#1a2035',
                  fontWeight: '600',
                  letterSpacing: '0.3px'
                }}>
                  Additional Filters
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 2, backgroundColor: '#ffffff' }}>
              <Grid container spacing={2}>
                {/* Tab-specific Filters */}
                {activeTab === 0 && (
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#6b7280', '&.Mui-focused': { color: 'maroon' } }}>
                        Jackpot Type
                      </InputLabel>
                      <Select
                        value={jackpotFilter}
                        onChange={(e) => setJackpotFilter(e.target.value as JackpotType | 'all')}
                        label="Jackpot Type"
                        sx={{
                          '& .MuiSelect-select': {
                            py: 1.5
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e5e7eb'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#9ca3af'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'maroon',
                            boxShadow: '0 0 0 2px rgba(139, 0, 0, 0.1)'
                          }
                        }}
                      >
                        {['All Types', 'Grand', 'Major', 'Minor', 'Mini'].map((type) => (
                          <MenuItem 
                            key={type.toLowerCase()} 
                            value={type.toLowerCase()}
                            sx={{
                              '&.Mui-selected': {
                                backgroundColor: 'rgba(139, 0, 0, 0.08)'
                              }
                            }}
                          >
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {activeTab === 1 && (
                  <>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: '#6b7280', '&.Mui-focused': { color: 'maroon' } }}>
                          Result
                        </InputLabel>
                        <Select
                          value={resultFilter}
                          onChange={(e) => setResultFilter(e.target.value as 'all' | 'win' | 'lose')}
                          label="Result"
                          sx={{
                            '& .MuiSelect-select': {
                              py: 1.5
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#e5e7eb'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#9ca3af'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'maroon',
                              boxShadow: '0 0 0 2px rgba(139, 0, 0, 0.1)'
                            }
                          }}
                        >
                          {['All Results', 'Wins Only', 'Losses Only'].map((option) => (
                            <MenuItem 
                              key={option.toLowerCase().replace(' ', '')} 
                              value={option.toLowerCase().replace(' ', '')}
                            >
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showEggDetails}
                            onChange={(e) => setShowEggDetails(e.target.checked)}
                            sx={{
                              '& .MuiSwitch-switchBase': {
                                color: '#d1d5db'
                              },
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: 'maroon',
                                '&:hover': {
                                  backgroundColor: 'rgba(139, 0, 0, 0.04)'
                                }
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: 'maroon'
                              }
                            }}
                          />
                        }
                        label={
                          <Typography variant="body2" sx={{ color: '#4b5563', fontWeight: '500' }}>
                            Show Egg Details
                          </Typography>
                        }
                        sx={{ ml: 1, mr: 0 }}
                      />
                    </Grid>
                  </>
                )}

                {activeTab === 2 && (
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#6b7280', '&.Mui-focused': { color: 'maroon' } }}>
                        Transaction Type
                      </InputLabel>
                      <Select
                        value={transactionFilter}
                        onChange={(e) => setTransactionFilter(e.target.value as TransactionType | 'all')}
                        label="Transaction Type"
                        sx={{
                          '& .MuiSelect-select': {
                            py: 1.5
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e5e7eb'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#9ca3af'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'maroon',
                            boxShadow: '0 0 0 2px rgba(139, 0, 0, 0.1)'
                          }
                        }}
                      >
                        {['All Types', 'Bets Only', 'Payouts Only'].map((type) => (
                          <MenuItem 
                            key={type.toLowerCase().replace(' ', '')} 
                            value={type.toLowerCase().replace(' ', '')}
                          >
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Amount Filters with Peso Symbol */}
                {['Min', 'Max'].map((type) => (
                  <Grid item xs={12} sm={6} md={3} key={`${type}-amount`}>
                    <TextField
                      fullWidth
                      label={`${type} Value (₱)`}
                      type="number"
                      value={type === 'Min' ? minAmountFilter : maxAmountFilter}
                      onChange={(e) => {
                        const value = e.target.value === '' ? '' : Number(e.target.value);
                        type === 'Min' ? setMinAmountFilter(value) : setMaxAmountFilter(value);
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography variant="body2" sx={{ color: 'maroon', fontWeight: 'bold' }}>
                              ₱
                            </Typography>
                          </InputAdornment>
                        ),
                        inputProps: {
                          min: 0,
                          step: 0.01
                        },
                        sx: {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e5e7eb'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#9ca3af'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'maroon',
                            boxShadow: '0 0 0 2px rgba(139, 0, 0, 0.1)'
                          }
                        }
                      }}
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: '#6b7280',
                          '&.Mui-focused': {
                            color: 'maroon'
                          }
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Paper>

        {/* Loading State - Centered with subtle animation */}
        {loading && (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            minHeight="200px"
            sx={{
              backgroundColor: 'rgba(26, 32, 53, 0.05)',
              borderRadius: 2
            }}
          >
            <CircularProgress 
              size={60}
              thickness={4}
              sx={{
                color: '#8B0000', // maroon
                '& .MuiCircularProgress-circle': {
                  animationDuration: '1.5s'
                }
              }} 
            />
          </Box>
        )}

        {/* Error State - Elegant alert with close button */}
        {error && (
          <Alert 
            severity="error"
            sx={{ 
              mb: 3,
              backgroundColor: '#FFEBEE',
              color: '#8B0000',
              borderLeft: '4px solid #8B0000',
              '& .MuiAlert-icon': {
                color: '#8B0000'
              },
              boxShadow: '0 2px 8px rgba(139, 0, 0, 0.1)'
            }}
            onClose={() => setError(null)}
          >
            <Typography variant="subtitle1" fontWeight="medium">Error</Typography>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        )}

        {/* Success Notification - Floating toast with smooth animation */}
        {exportSuccess && (
          <Snackbar
            open={exportSuccess}
            autoHideDuration={6000}
            onClose={() => setExportSuccess(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            TransitionComponent={Fade}
            sx={{
              '& .MuiPaper-root': {
                minWidth: 'unset'
              }
            }}
          >
            <Alert 
              onClose={() => setExportSuccess(false)} 
              severity="success"
              iconMapping={{
                success: <CheckCircleOutline fontSize="large" />
              }}
              sx={{
                backgroundColor: '#1a2035',
                color: 'white',
                '& .MuiAlert-icon': {
                  color: '#4CAF50'
                },
                '& .MuiAlert-action': {
                  color: 'white'
                },
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '8px',
                padding: '12px 16px'
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">Success!</Typography>
                <Typography variant="body2">Export completed successfully.</Typography>
              </Box>
            </Alert>
          </Snackbar>
        )}

        {/* Content when not loading */}
        {!loading && (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Total Bets Card */}
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  height: '100%',
                  background: 'linear-gradient(135deg, #1a2035 0%, #2d3548 100%)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  borderLeft: '4px solid #8B0000',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  '&:hover': { 
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 25px rgba(139, 0, 0, 0.2)'
                  }
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        mr: 2,
                        width: 44,
                        height: 44
                      }}>
                        <CasinoIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight="500">
                        Total Bets
                      </Typography>
                    </Box>
                    <Typography variant="h4" component="div" fontWeight="700" gutterBottom>
                      {summary ? formatCurrency(summary.totalBets) : '₱0.00'}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
                          {summary?.totalRounds} rounds
                        </Typography>
                        <Typography variant="caption" display="block" color="rgba(255, 255, 255, 0.7)">
                          Avg: {summary ? formatCurrency(summary.averageBet) : '₱0.00'}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        bgcolor: 'rgba(139, 0, 0, 0.2)',
                        borderRadius: '12px',
                        px: 1,
                        py: 0.5
                      }}>
                        <Typography variant="caption" color="white">
                          {summary ? Math.round(summary.totalBets / summary.totalRounds) : 0}x
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Total Payouts Card */}
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  height: '100%',
                  background: 'linear-gradient(135deg, #1a2035 0%, #2d3548 100%)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  borderLeft: '4px solid #4CAF50',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  '&:hover': { 
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 25px rgba(76, 175, 80, 0.2)'
                  }
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ 
                        bgcolor: 'rgba(76, 175, 80, 0.1)',
                        color: '#4CAF50',
                        mr: 2,
                        width: 44,
                        height: 44
                      }}>
                        <ArrowUpwardIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight="500">
                        Total Payouts
                      </Typography>
                    </Box>
                    <Typography variant="h4" component="div" fontWeight="700" gutterBottom>
                      {summary ? formatCurrency(summary.totalPayouts) : '₱0.00'}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-end">
                      <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
                        Highest Win: {summary ? formatCurrency(summary.highestWin) : '₱0.00'}
                      </Typography>
                      <Box sx={{ 
                        bgcolor: 'rgba(76, 175, 80, 0.2)',
                        borderRadius: '12px',
                        px: 1,
                        py: 0.5
                      }}>
                        <Typography variant="caption" color="white">
                          {summary ? Math.round(summary.totalPayouts / summary.totalBets * 100) : 0}%
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Total Jackpots Card */}
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  height: '100%',
                  background: 'linear-gradient(135deg, #1a2035 0%, #2d3548 100%)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  borderLeft: '4px solid #FFC107',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  '&:hover': { 
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 25px rgba(255, 193, 7, 0.2)'
                  }
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ 
                        bgcolor: 'rgba(255, 193, 7, 0.1)',
                        color: '#FFC107',
                        mr: 2,
                        width: 44,
                        height: 44
                      }}>
                        <ReceiptIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight="500">
                        Total Jackpots
                      </Typography>
                    </Box>
                    <Typography variant="h4" component="div" fontWeight="700" gutterBottom>
                      {summary ? formatCurrency(summary.totalJackpots) : '₱0.00'}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-end">
                      <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
                        Biggest: {summary ? formatCurrency(summary.biggestJackpot) : '₱0.00'}
                      </Typography>
                      <Box display="flex" gap={0.5}>
                        {summary && Object.entries(summary.jackpotBreakdown).map(([type, count]) => (
                          <Tooltip key={type} title={`${type}: ${count}`}>
                            <Chip 
                              label={type.charAt(0).toUpperCase()} 
                              size="small"
                              sx={{ 
                                fontSize: '0.6rem', 
                                height: 20,
                                bgcolor: 'rgba(255, 193, 7, 0.2)',
                                color: '#FFC107'
                              }}
                            />
                          </Tooltip>
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Net Revenue Card */}
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  height: '100%',
                  background: 'linear-gradient(135deg, #1a2035 0%, #2d3548 100%)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  borderLeft: '4px solid #8B0000',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  '&:hover': { 
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 25px rgba(139, 0, 0, 0.2)'
                  }
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ 
                        bgcolor: 'rgba(139, 0, 0, 0.2)',
                        color: 'white',
                        mr: 2,
                        width: 44,
                        height: 44
                      }}>
                        <MoneyIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight="500">
                        Net Revenue
                      </Typography>
                    </Box>
                    <Typography variant="h4" component="div" fontWeight="700" gutterBottom>
                      {summary ? formatCurrency(calculateNetRevenue()) : '₱0.00'}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-end">
                      <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
                        {summary?.activePlayers} players
                      </Typography>
                      <Box sx={{ 
                        bgcolor: summary && calculateNetRevenue() >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                        borderRadius: '12px',
                        px: 1,
                        py: 0.5
                      }}>
                        <Typography variant="caption" color="white">
                          {summary ? (summary.payoutRatio * 100).toFixed(2) : '0.00'}%
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Prize Levels Summary */}
            <Paper sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              background: 'linear-gradient(135deg, #1a2035 0%, #2d3548 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontWeight: '700',
                  color: 'white',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Diamond color="secondary" sx={{ mr: 1, fontSize: '28px' }} />
                JACKPOT PRIZE LEVELS
              </Typography>
              
              <Grid container spacing={3}>
                {prizes.map((prize) => {
                  // Define color schemes for each prize type
                  const colorMap = {
                    grand: {
                      main: '#8B0000', // maroon
                      light: 'rgba(139, 0, 0, 0.1)',
                      contrast: '#ff5252'
                    },
                    major: {
                      main: '#FFC107',
                      light: 'rgba(255, 193, 7, 0.1)',
                      contrast: '#FFC107'
                    },
                    minor: {
                      main: '#2196F3',
                      light: 'rgba(33, 150, 243, 0.1)',
                      contrast: '#2196F3'
                    },
                    mini: {
                      main: '#4CAF50',
                      light: 'rgba(76, 175, 80, 0.1)',
                      contrast: '#4CAF50'
                    }
                  };
                  
                  const colors = colorMap[prize.type] || colorMap.mini;
                  
                  return (
                    <Grid item xs={12} sm={6} md={3} key={prize.id}>
                      <Card sx={{ 
                        height: '100%',
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                        '&:hover': { 
                          transform: 'translateY(-5px)',
                          boxShadow: `0 8px 25px ${colors.main}33`,
                          borderColor: colors.main
                        }
                      }}>
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={2}>
                            <Avatar sx={{ 
                              bgcolor: colors.light,
                              color: colors.contrast,
                              mr: 2,
                              width: 40,
                              height: 40,
                              fontWeight: 'bold',
                              border: `1px solid ${colors.main}`
                            }}>
                              {prize.type.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography 
                              variant="h6" 
                              component="div"
                              sx={{
                                color: 'white',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                              }}
                            >
                              {prize.type}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ 
                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                            p: 1.5,
                            borderRadius: '8px',
                            mb: 2
                          }}>
                            <Typography variant="body1" sx={{ color: 'white' }}>
                              <Box component="span" sx={{ color: colors.contrast, fontWeight: '500' }}>
                                {formatCurrency(prize.amount)}
                              </Box>
                            </Typography>
                          </Box>
                          
                          <Box display="flex" justifyContent="space-between" mb={2}>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Will be Awarded
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white', fontWeight: '500' }}>
                                {prize.count}x
                              </Typography>
                            </Box>
                            <Box textAlign="right">
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Percentage
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white', fontWeight: '500' }}>
                                {(prize.probability * 100).toFixed(6)}%
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box width="100%" height={6} bgcolor="rgba(255, 255, 255, 0.1)" borderRadius={3}>
                            <Box 
                              width={`${Math.min(prize.probability * 1000, 100)}%`} 
                              height="100%" 
                              bgcolor={colors.main}
                              borderRadius={3}
                              sx={{
                                boxShadow: `0 0 8px ${colors.main}`,
                                transition: 'width 1s ease-out'
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>

            {/* Tabs for different data sections */}
            <Paper sx={{ 
              mb: 3, 
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #1a2035 0%, #2d3548 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  background: 'linear-gradient(135deg, rgba(26, 32, 53, 0.9) 0%, rgba(43, 51, 80, 0.9) 100%)',
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#8B0000',
                    height: 3
                  },
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    minHeight: 48,
                    '&.Mui-selected': {
                      color: 'white',
                      fontWeight: '600'
                    },
                    '&:hover': {
                      color: 'white',
                      opacity: 1
                    }
                  }
                }}
              >
                <Tab 
                  label={
                    <Box display="flex" alignItems="center">
                      <ReceiptIcon sx={{ fontSize: '1.1rem', mr: 1 }} />
                      <span>Jackpot Logs</span>
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box display="flex" alignItems="center">
                      <CasinoIcon sx={{ fontSize: '1.1rem', mr: 1 }} />
                      <span>Game Rounds</span>
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box display="flex" alignItems="center">
                      <Wallet sx={{ fontSize: '1.1rem', mr: 1 }} />
                      <span>Transactions</span>
                    </Box>
                  } 
                />
              </Tabs>

              {/* Tab Panels */}
              <Box sx={{ p: 0 }}>
                {/* Jackpot Logs Tab */}
                {activeTab === 0 && (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          {jackpotColumns.map((column) => (
                            <TableCell
                              key={column.id}
                              align={column.align || 'left'}
                              sortDirection={orderBy === column.id ? order : false}
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontWeight: '600',
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderBottom: 'none',
                                width: column.width,
                                minWidth: column.width
                              }}
                            >
                              {column.sortable ? (
                                <TableSortLabel
                                  active={orderBy === column.id}
                                  direction={orderBy === column.id ? order : 'asc'}
                                  onClick={() => handleRequestSort(column.id)}
                                  sx={{
                                    color: 'inherit !important',
                                    '&:hover': {
                                      color: 'white !important'
                                    },
                                    '&.Mui-active': {
                                      color: 'white !important'
                                    }
                                  }}
                                >
                                  {column.label}
                                  {orderBy === column.id ? (
                                    <Box component="span" sx={visuallyHidden}>
                                      {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                    </Box>
                                  ) : null}
                                </TableSortLabel>
                              ) : column.label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedJackpotLogs.length > 0 ? (
                          sortedJackpotLogs.map((log, index) => (
                            <TableRow 
                              hover 
                              key={log.id}
                              sx={{ 
                                backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                                '&:hover': {
                                  backgroundColor: 'rgba(139, 0, 0, 0.1)'
                                }
                              }}
                            >
                              {jackpotColumns.map((column) => {
                                const value = log[column.id as keyof JackpotLog];
                                return (
                                  <TableCell 
                                    key={column.id} 
                                    align={column.align || 'left'}
                                    sx={{
                                      color: 'rgba(255, 255, 255, 0.9)',
                                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                      ...(column.id === 'amount' ? { 
                                        fontWeight: 'bold',
                                        color: '#8B0000'
                                      } : {})
                                    }}
                                  >
                                    {column.format ? column.format(value) : value}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={jackpotColumns.length} align="center" sx={{ py: 4 }}>
                              <Box display="flex" flexDirection="column" alignItems="center">
                                <ReceiptIcon sx={{ fontSize: '3rem', color: 'rgba(255, 255, 255, 0.2)', mb: 1 }} />
                                <Typography color="rgba(255, 255, 255, 0.5)">
                                  No jackpot logs found
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25]}
                      component="div"
                      count={filteredJackpotLogs.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        '& .MuiTablePagination-selectIcon': {
                          color: 'rgba(255, 255, 255, 0.7)'
                        }
                      }}
                    />
                  </TableContainer>
                )}

                {/* Game Rounds Tab */}
                {activeTab === 1 && (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          {roundColumns.map((column) => (
                            <TableCell
                              key={column.id}
                              align={column.align || 'left'}
                              sortDirection={orderBy === column.id ? order : false}
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontWeight: '600',
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderBottom: 'none',
                                width: column.width,
                                minWidth: column.width
                              }}
                            >
                              {column.sortable ? (
                                <TableSortLabel
                                  active={orderBy === column.id}
                                  direction={orderBy === column.id ? order : 'asc'}
                                  onClick={() => handleRequestSort(column.id)}
                                  sx={{
                                    color: 'inherit !important',
                                    '&:hover': {
                                      color: 'white !important'
                                    },
                                    '&.Mui-active': {
                                      color: 'white !important'
                                    }
                                  }}
                                >
                                  {column.label}
                                  {orderBy === column.id ? (
                                    <Box component="span" sx={visuallyHidden}>
                                      {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                    </Box>
                                  ) : null}
                                </TableSortLabel>
                              ) : column.label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedRounds.length > 0 ? (
                          sortedRounds.map((round, index) => (
                            <>
                              <TableRow 
                                hover 
                                key={round.id}
                                sx={{ 
                                  backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(139, 0, 0, 0.1)'
                                  }
                                }}
                              >
                                {roundColumns.map((column) => {
                                  const value = round[column.id as keyof GameRound];
                                  return (
                                    <TableCell 
                                      key={column.id} 
                                      align={column.align || 'left'}
                                      sx={{
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                        ...(column.id === 'winning_amount' || column.id === 'jackpot_amount' ? { 
                                          fontWeight: 'bold',
                                          color: column.id === 'winning_amount' ? '#4CAF50' : '#8B0000'
                                        } : {})
                                      }}
                                    >
                                      {column.format ? column.format(value) : value}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                              {showEggDetails && (
                                <TableRow>
                                  <TableCell colSpan={roundColumns.length} sx={{ 
                                    py: 2, 
                                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                                  }}>
                                    <Box>
                                      <Typography variant="subtitle2" gutterBottom sx={{ 
                                        fontWeight: '600',
                                        color: 'rgba(255, 255, 255, 0.8)',
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}>
                                        <Egg sx={{ fontSize: '1rem', mr: 1 }} />
                                        Egg Sequence Details
                                      </Typography>
                                      <Grid container spacing={1}>
                                        {round.eggs.map((egg, index) => (
                                          <Grid item xs={6} sm={4} md={3} key={egg.id || index}>
                                            <Paper sx={{ 
                                              p: 1, 
                                              backgroundColor: egg.color,
                                              color: 'white',
                                              textAlign: 'center',
                                              position: 'relative',
                                              overflow: 'hidden',
                                              textShadow: egg.textShadow,
                                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                                              border: '1px solid rgba(255, 255, 255, 0.2)',
                                              transition: 'all 0.3s',
                                              '&:hover': {
                                                transform: 'scale(1.05)',
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                                              }
                                            }}>
                                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                {egg.item}
                                              </Typography>
                                              <Box sx={{ 
                                                position: 'absolute', 
                                                top: 0, 
                                                right: 0, 
                                                p: 0.5,
                                                fontSize: '0.6rem',
                                                backgroundColor: 'rgba(0,0,0,0.3)',
                                                borderBottomLeftRadius: '4px'
                                              }}>
                                                #{egg.id + 1}
                                              </Box>
                                              {egg.cracked && (
                                                <Box sx={{
                                                  position: 'absolute',
                                                  top: 0,
                                                  left: 0,
                                                  width: '100%',
                                                  height: '100%',
                                                  backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, transparent 75%, transparent)',
                                                  backgroundSize: '4px 4px'
                                                }} />
                                              )}
                                              {egg.scratched && (
                                                <Box sx={{
                                                  position: 'absolute',
                                                  top: 0,
                                                  left: 0,
                                                  width: '100%',
                                                  height: '100%',
                                                  backgroundImage: 'repeating-linear-gradient(-45deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 1px, transparent 1px, transparent 4px)'
                                                }} />
                                              )}
                                            </Paper>
                                          </Grid>
                                        ))}
                                      </Grid>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={roundColumns.length} align="center" sx={{ py: 4 }}>
                              <Box display="flex" flexDirection="column" alignItems="center">
                                <CasinoIcon sx={{ fontSize: '3rem', color: 'rgba(255, 255, 255, 0.2)', mb: 1 }} />
                                <Typography color="rgba(255, 255, 255, 0.5)">
                                  No game rounds found
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25]}
                      component="div"
                      count={filteredRounds.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        '& .MuiTablePagination-selectIcon': {
                          color: 'rgba(255, 255, 255, 0.7)'
                        }
                      }}
                    />
                  </TableContainer>
                )}

                {/* Transactions Tab */}
                {activeTab === 2 && (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          {transactionColumns.map((column) => (
                            <TableCell
                              key={column.id}
                              align={column.align || 'left'}
                              sortDirection={orderBy === column.id ? order : false}
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontWeight: '600',
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                borderBottom: 'none',
                                width: column.width,
                                minWidth: column.width
                              }}
                            >
                              {column.sortable ? (
                                <TableSortLabel
                                  active={orderBy === column.id}
                                  direction={orderBy === column.id ? order : 'asc'}
                                  onClick={() => handleRequestSort(column.id)}
                                  sx={{
                                    color: 'inherit !important',
                                    '&:hover': {
                                      color: 'white !important'
                                    },
                                    '&.Mui-active': {
                                      color: 'white !important'
                                    }
                                  }}
                                >
                                  {column.label}
                                  {orderBy === column.id ? (
                                    <Box component="span" sx={visuallyHidden}>
                                      {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                    </Box>
                                  ) : null}
                                </TableSortLabel>
                              ) : column.label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedTransactions.length > 0 ? (
                          sortedTransactions.map((tx, index) => (
                            <TableRow 
                              hover 
                              key={tx.id}
                              sx={{ 
                                backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                                '&:hover': {
                                  backgroundColor: 'rgba(139, 0, 0, 0.1)'
                                }
                              }}
                            >
                              {transactionColumns.map((column) => {
                                const value = tx[column.id as keyof Transaction];
                                return (
                                  <TableCell 
                                    key={column.id} 
                                    align={column.align || 'left'}
                                    sx={{
                                      color: 'rgba(255, 255, 255, 0.9)',
                                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                      ...(column.id === 'amount' ? { 
                                        fontWeight: 'bold',
                                        color: tx.type === 'deposit' ? '#4CAF50' : '#8B0000'
                                      } : {})
                                    }}
                                  >
                                    {column.format ? column.format(value) : value}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={transactionColumns.length} align="center" sx={{ py: 4 }}>
                              <Box display="flex" flexDirection="column" alignItems="center">
                                <MoneyIcon sx={{ fontSize: '3rem', color: 'rgba(255, 255, 255, 0.2)', mb: 1 }} />
                                <Typography color="rgba(255, 255, 255, 0.5)">
                                  No transactions found
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25]}
                      component="div"
                      count={filteredTransactions.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        '& .MuiTablePagination-selectIcon': {
                          color: 'rgba(255, 255, 255, 0.7)'
                        }
                      }}
                    />
                  </TableContainer>
                )}
              </Box>
            </Paper>
          </>
        )}

        {/* Export Confirmation Dialog */}
        <Dialog 
          open={exportDialogOpen} 
          onClose={() => setExportDialogOpen(false)} 
          fullWidth 
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(26, 32, 53, 0.2)'
            }
          }}
        >
          {/* Dialog Header */}
          <DialogTitle sx={{ 
            backgroundColor: '#1a2035',
            color: 'white',
            py: 2,
            borderBottom: '2px solid maroon',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box display="flex" alignItems="center">
              <DownloadIcon sx={{ 
                mr: 1.5,
                fontSize: 28,
                color: 'rgba(255,255,255,0.9)'
              }} />
              <Typography variant="h6" sx={{ fontWeight: '600' }}>
                Export {exportType.toUpperCase()} Report
              </Typography>
            </Box>
            <IconButton 
              onClick={() => setExportDialogOpen(false)} 
              sx={{ 
                color: 'rgba(255,255,255,0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          {/* Dialog Content */}
          <DialogContent sx={{ p: 4 }}>
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              textAlign="center"
              sx={{
                p: 3,
                border: '1px dashed #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#f9fafb',
                mb: 3
              }}
            >
              {exportType === 'pdf' ? (
                <PictureAsPdf sx={{ 
                  fontSize: 72, 
                  mb: 2,
                  color: 'maroon',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }} />
              ) : (
                <Description sx={{ 
                  fontSize: 72, 
                  mb: 2,
                  color: '#1a7f56',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }} />
              )}
              
              <Typography variant="h6" gutterBottom sx={{ fontWeight: '600', color: '#1a2035' }}>
                Export Report as {exportType.toUpperCase()}
              </Typography>
              
              <Typography variant="body1" sx={{ 
                color: '#6b7280',
                mb: 2,
                maxWidth: '80%'
              }}>
                You are about to export the current report data as {exportType.toUpperCase()} file.
              </Typography>
              
              <Box sx={{ 
                width: '100%',
                p: 2,
                mt: 2,
                backgroundColor: 'white',
                borderRadius: '6px',
                borderLeft: '3px solid #1a2035'
              }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>
                    Date Range:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1a2035', fontWeight: '500' }}>
                    {startDate?.format('MMM D, YYYY')} to {endDate?.format('MMM D, YYYY')}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>
                    Total Records:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1a2035', fontWeight: '500' }}>
                    {activeTab === 0 ? filteredJackpotLogs.length : 
                    activeTab === 1 ? filteredRounds.length : 
                    filteredTransactions.length}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </DialogContent>

          {/* Dialog Actions */}
          <DialogActions sx={{ 
            p: 3,
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            justifyContent: 'space-between'
          }}>
            <Button 
              onClick={() => setExportDialogOpen(false)} 
              sx={{
                color: '#6b7280',
                fontWeight: '600',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.04)'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmExport} 
              variant="contained"
              disabled={exportInProgress}
              startIcon={exportInProgress ? 
                <CircularProgress size={20} sx={{ color: 'white' }} /> : 
                (exportType === 'pdf' ? <PictureAsPdf /> : <Description />)
              }
              sx={{
                backgroundColor: exportType === 'pdf' ? 'maroon' : '#1a7f56',
                color: 'white',
                px: 3,
                py: 1,
                borderRadius: '6px',
                fontWeight: '600',
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: exportType === 'pdf' ? '#800000' : '#0d6e47',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                },
                '&:disabled': {
                  backgroundColor: '#e5e7eb',
                  color: '#9ca3af'
                }
              }}
            >
              {exportInProgress ? 'Exporting...' : `Export as ${exportType.toUpperCase()}`}
            </Button>
          </DialogActions>
        </Dialog>
          
          {/* Optional footer accent */}
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, maroon 0%, #1a2035 100%)',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px'
          }} />
        </Paper>
        
        {/* Optional floating action button */}
        {/* {true && (
          <Fab 
            color="primary" 
            sx={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              backgroundColor: 'maroon',
              color: 'white',
              '&:hover': {
                backgroundColor: '#900',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(139, 0, 0, 0.3)'
            }}
          >
            <Add />
          </Fab>
        )} */}
      </Box>
      
    </LocalizationProvider>
  );
};

export default AdminReports;