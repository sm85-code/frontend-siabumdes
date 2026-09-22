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
} from "lucide-react";

import {
  House as PhHouse,
  Receipt as PhReceipt,
  ChartLine as PhChartLine,
  ChartBar as PhChartBar,
  Storefront as PhStorefront,
  UsersThree as PhUsersThree,
  BookOpenText as PhBookOpenText,
  SignOut as PhSignOut,
  List as PhList,
  X as PhX,
  Books as PhBooks,
  UserCircle as PhUserCircle,
  Package as PhPackage,
  Eye as PhEye,
  EyeSlash as PhEyeSlash,
  SignIn as PhSignIn,
  ArrowLeft as PhArrowLeft,
  ArrowRight as PhArrowRight,
  Buildings as PhBuildings,
  HandHeart as PhHandHeart,
  TrendUp as PhTrendUp,
  TrendDown as PhTrendDown,
  Coin as PhCoin,
  ReceiptX as PhReceiptX,
  CalendarBlank as PhCalendarBlank,
  Lock as PhLock,
  Plus as PhPlus,
  Trash as PhTrash,
  Pencil as PhPencil,
  PencilSimple as PhPencilSimple,
  FileArrowUp as PhFileArrowUp,
  DownloadSimple as PhDownloadSimple,
  FileXls as PhFileXls,
  Paperclip as PhPaperclip,
  LinkSimple as PhLinkSimple,
  GoogleDriveLogo as PhGoogleDriveLogo,
  FilePdf as PhFilePdf,
  FileDoc as PhFileDoc,
  Scales as PhScales,
  Coins as PhCoins,
  BookOpen as PhBookOpen,
  MagnifyingGlass as PhMagnifyingGlass,
  UploadSimple as PhUploadSimple,
  Warning as PhWarning,
  ArrowDown as PhArrowDown,
  ArrowUp as PhArrowUp,
  SlidersHorizontal as PhSlidersHorizontal,
  Key as PhKey,
  Truck as PhTruck,
  Users as PhUsers,
  Wallet as PhWallet,
  HandCoins as PhHandCoins,
} from "phosphor-native";

import { useTheme } from "@/lib/theme";

/**
 * Themed icon: "modern" renders the current thin-outline Lucide icon
 * unchanged (zero regression). "classic"/"playful" render the real Phosphor
 * icon of the same glyph at weight="fill"/"duotone" -- these names already
 * match Phosphor's own icon set 1:1 (this app used real Phosphor before an
 * earlier rebrand swapped the renderer to Lucide), so no icon needed
 * "translating" between libraries.
 */
function wrap(LucideIcon, PhosphorIcon) {
  return function MappedIcon({ size = 18, weight, color, className, ...rest }) {
    const { theme } = useTheme();
    if (PhosphorIcon && theme !== "modern") {
      const phosphorWeight = theme === "classic" ? "fill" : "duotone";
      return (
        <PhosphorIcon size={size} weight={phosphorWeight} color={color} className={className} {...rest} />
      );
    }
    const strokeWidth = weight === "fill" || weight === "bold" ? 2.35 : 1.7;
    return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} className={className} {...rest} />;
  };
}

export const House = wrap(LuHome, PhHouse);
export const Receipt = wrap(LuReceipt, PhReceipt);
export const ChartLine = wrap(LuLineChart, PhChartLine);
export const ChartBar = wrap(LuBarChart3, PhChartBar);
export const Storefront = wrap(LuStore, PhStorefront);
export const UsersThree = wrap(LuUsers, PhUsersThree);
export const BookOpenText = wrap(LuBookOpen, PhBookOpenText);
export const SignOut = wrap(LuLogOut, PhSignOut);
export const List = wrap(LuMenu, PhList);
export const X = wrap(LuX, PhX);
export const Books = wrap(LuLibrary, PhBooks);
export const Calculator = wrap(LuCalculator);
export const UserCircle = wrap(LuUserCircle, PhUserCircle);
export const Package = wrap(LuPackage, PhPackage);
export const Eye = wrap(LuEye, PhEye);
export const EyeSlash = wrap(LuEyeOff, PhEyeSlash);
export const SignIn = wrap(LuLogIn, PhSignIn);
export const ArrowLeft = wrap(LuArrowLeft, PhArrowLeft);
export const ArrowRight = wrap(LuArrowRight, PhArrowRight);
export const Buildings = wrap(LuBuilding2, PhBuildings);
export const HandHeart = wrap(LuHeartHandshake, PhHandHeart);
export const ChartLineUp = wrap(LuTrendingUp, PhTrendUp);
export const TrendUp = wrap(LuTrendingUp, PhTrendUp);
export const TrendDown = wrap(LuTrendingDown, PhTrendDown);
export const Coin = wrap(LuCoins, PhCoin);
export const ReceiptX = wrap(LuReceipt, PhReceiptX);
export const CalendarBlank = wrap(LuCalendar, PhCalendarBlank);
export const Lock = wrap(LuLock, PhLock);
export const Plus = wrap(LuPlus, PhPlus);
export const Trash = wrap(LuTrash2, PhTrash);
export const Pencil = wrap(LuPencil, PhPencil);
export const PencilSimple = wrap(LuPencil, PhPencilSimple);
export const FileArrowUp = wrap(LuFileUp, PhFileArrowUp);
export const DownloadSimple = wrap(LuDownload, PhDownloadSimple);
export const FileXls = wrap(LuFileSpreadsheet, PhFileXls);
export const Paperclip = wrap(LuPaperclip, PhPaperclip);
export const LinkSimple = wrap(LuLink, PhLinkSimple);
export const GoogleDriveLogo = wrap(LuCloud, PhGoogleDriveLogo);
export const FilePdf = wrap(LuFileText, PhFilePdf);
export const FileDoc = wrap(LuFileType2, PhFileDoc);
export const Scales = wrap(LuScale, PhScales);
export const Coins = wrap(LuCoins, PhCoins);
export const BookOpen = wrap(LuBookOpen, PhBookOpen);
export const MagnifyingGlass = wrap(LuSearch, PhMagnifyingGlass);
export const UploadSimple = wrap(LuUpload, PhUploadSimple);
export const Warning = wrap(LuTriangleAlert, PhWarning);
export const ArrowDown = wrap(LuArrowDown, PhArrowDown);
export const ArrowUp = wrap(LuArrowUp, PhArrowUp);
export const SlidersHorizontal = wrap(LuSlidersHorizontal, PhSlidersHorizontal);
export const ChartPie = wrap(LuPieChart);
export const Key = wrap(LuKey, PhKey);
export const Fish = wrap(LuFish);
export const Tree = wrap(LuTreePine);
export const Sun = wrap(LuSun);
export const Boat = wrap(LuShip);
export const Truck = wrap(LuTruck, PhTruck);
export const Users = wrap(LuUsersFlat, PhUsers);
export const Wallet = wrap(LuWallet, PhWallet);
export const HandCoins = wrap(LuHandCoins, PhHandCoins);
