import {
  Home as LuHome,
  Receipt as LuReceipt,
  LineChart as LuLineChart,
  BarChart3 as LuBarChart3,
  Store as LuStore,
  Users as LuUsers,
  BookOpen as LuBookOpen,
  LogOut as LuLogOut,
  Menu as LuMenu,
  X as LuX,
  Library as LuLibrary,
  Calculator as LuCalculator,
  UserCircle as LuUserCircle,
  Package as LuPackage,
  Eye as LuEye,
  EyeOff as LuEyeOff,
  LogIn as LuLogIn,
  ArrowLeft as LuArrowLeft,
  ArrowRight as LuArrowRight,
  Building2 as LuBuilding2,
  HeartHandshake as LuHeartHandshake,
  TrendingUp as LuTrendingUp,
  TrendingDown as LuTrendingDown,
  Coins as LuCoins,
  Calendar as LuCalendar,
  Lock as LuLock,
  Plus as LuPlus,
  Trash2 as LuTrash2,
  Pencil as LuPencil,
  FileUp as LuFileUp,
  Download as LuDownload,
  FileSpreadsheet as LuFileSpreadsheet,
  Paperclip as LuPaperclip,
  Link as LuLink,
  Cloud as LuCloud,
  FileText as LuFileText,
  Scale as LuScale,
  Search as LuSearch,
  Upload as LuUpload,
  TriangleAlert as LuTriangleAlert,
  ArrowDown as LuArrowDown,
  ArrowUp as LuArrowUp,
  SlidersHorizontal as LuSlidersHorizontal,
  PieChart as LuPieChart,
  Key as LuKey,
  Fish as LuFish,
  TreePine as LuTreePine,
  Sun as LuSun,
  Ship as LuShip,
  Truck as LuTruck,
  Users as LuUsersFlat,
  Wallet as LuWallet,
  HandCoins as LuHandCoins,
  FileType2 as LuFileType2,
  ChevronsUpDown as LuChevronsUpDown,
  Check as LuCheck,
} from "lucide-react";

/**
 * Modern is the app's only theme now, and Modern always rendered
 * lucide-react icons -- so there is no more theme-conditional Phosphor
 * rendering here. This thin wrapper only survives to translate the
 * Phosphor-style `weight` prop (still passed by callers such as
 * Layout.jsx) into a Lucide `strokeWidth`, so it isn't forwarded as a
 * stray DOM attribute on the rendered <svg>.
 */
function wrap(LucideIcon) {
  return function MappedIcon({ size = 18, weight, color, className, ...rest }) {
    const strokeWidth = weight === "fill" || weight === "bold" ? 2.35 : 1.7;
    return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} className={className} {...rest} />;
  };
}

export const House = wrap(LuHome);
export const Receipt = wrap(LuReceipt);
export const ChartLine = wrap(LuLineChart);
export const ChartBar = wrap(LuBarChart3);
export const Storefront = wrap(LuStore);
export const UsersThree = wrap(LuUsers);
export const BookOpenText = wrap(LuBookOpen);
export const SignOut = wrap(LuLogOut);
export const List = wrap(LuMenu);
export const X = wrap(LuX);
export const Books = wrap(LuLibrary);
export const Calculator = wrap(LuCalculator);
export const UserCircle = wrap(LuUserCircle);
export const Package = wrap(LuPackage);
export const Eye = wrap(LuEye);
export const EyeSlash = wrap(LuEyeOff);
export const SignIn = wrap(LuLogIn);
export const ArrowLeft = wrap(LuArrowLeft);
export const ArrowRight = wrap(LuArrowRight);
export const Buildings = wrap(LuBuilding2);
export const HandHeart = wrap(LuHeartHandshake);
export const ChartLineUp = wrap(LuTrendingUp);
export const TrendUp = wrap(LuTrendingUp);
export const TrendDown = wrap(LuTrendingDown);
export const Coin = wrap(LuCoins);
export const ReceiptX = wrap(LuReceipt);
export const CalendarBlank = wrap(LuCalendar);
export const Lock = wrap(LuLock);
export const Plus = wrap(LuPlus);
export const Trash = wrap(LuTrash2);
export const Pencil = wrap(LuPencil);
export const PencilSimple = wrap(LuPencil);
export const FileArrowUp = wrap(LuFileUp);
export const DownloadSimple = wrap(LuDownload);
export const FileXls = wrap(LuFileSpreadsheet);
export const Paperclip = wrap(LuPaperclip);
export const LinkSimple = wrap(LuLink);
export const GoogleDriveLogo = wrap(LuCloud);
export const FilePdf = wrap(LuFileText);
export const FileDoc = wrap(LuFileType2);
export const Scales = wrap(LuScale);
export const Coins = wrap(LuCoins);
export const BookOpen = wrap(LuBookOpen);
export const MagnifyingGlass = wrap(LuSearch);
export const UploadSimple = wrap(LuUpload);
export const Warning = wrap(LuTriangleAlert);
export const ArrowDown = wrap(LuArrowDown);
export const ArrowUp = wrap(LuArrowUp);
export const SlidersHorizontal = wrap(LuSlidersHorizontal);
export const ChartPie = wrap(LuPieChart);
export const Key = wrap(LuKey);
export const Fish = wrap(LuFish);
export const Tree = wrap(LuTreePine);
export const Sun = wrap(LuSun);
export const Boat = wrap(LuShip);
export const Truck = wrap(LuTruck);
export const Users = wrap(LuUsersFlat);
export const Wallet = wrap(LuWallet);
export const HandCoins = wrap(LuHandCoins);
export const CaretUpDown = wrap(LuChevronsUpDown);
export const Check = wrap(LuCheck);
