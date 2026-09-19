import {
  Home, Receipt, LineChart, BarChart3, Store, Users, BookOpen,
  LogOut, Menu, X, Library, Calculator, UserCircle, Package,
  Eye, EyeOff, LogIn, ArrowLeft, ArrowRight, Building2, HeartHandshake,
  TrendingUp, TrendingDown, Coins, Calendar, Lock, Plus, Trash2, Pencil,
  FileUp, Download, FileSpreadsheet, Paperclip, Link, Cloud,
  FileText, Scale, Search, Upload, TriangleAlert, ArrowDown, ArrowUp,
  SlidersHorizontal, PieChart, Key,
} from "lucide-react";

function wrap(Icon) {
  return function MappedIcon({ size = 18, weight, color, className, ...rest }) {
    const strokeWidth = weight === "fill" || weight === "bold" ? 2.35 : 1.7;
    return <Icon size={size} color={color} strokeWidth={strokeWidth} className={className} {...rest} />;
  };
}

export const House = wrap(Home);
export const Receipt = wrap(Receipt);
export const ChartLine = wrap(LineChart);
export const ChartBar = wrap(BarChart3);
export const Storefront = wrap(Store);
export const UsersThree = wrap(Users);
export const BookOpenText = wrap(BookOpen);
export const SignOut = wrap(LogOut);
export const List = wrap(Menu);
export const X = wrap(X);
export const Books = wrap(Library);
export const Calculator = wrap(Calculator);
export const UserCircle = wrap(UserCircle);
export const Package = wrap(Package);
export const Eye = wrap(Eye);
export const EyeSlash = wrap(EyeOff);
export const SignIn = wrap(LogIn);
export const ArrowLeft = wrap(ArrowLeft);
export const ArrowRight = wrap(ArrowRight);
export const Buildings = wrap(Building2);
export const HandHeart = wrap(HeartHandshake);
export const ChartLineUp = wrap(TrendingUp);
export const TrendUp = wrap(TrendingUp);
export const TrendDown = wrap(TrendingDown);
export const Coin = wrap(Coins);
export const ReceiptX = wrap(Receipt);
export const CalendarBlank = wrap(Calendar);
export const Lock = wrap(Lock);
export const Plus = wrap(Plus);
export const Trash = wrap(Trash2);
export const Pencil = wrap(Pencil);
export const PencilSimple = wrap(Pencil);
export const FileArrowUp = wrap(FileUp);
export const DownloadSimple = wrap(Download);
export const FileXls = wrap(FileSpreadsheet);
export const Paperclip = wrap(Paperclip);
export const LinkSimple = wrap(Link);
export const GoogleDriveLogo = wrap(Cloud);
export const FilePdf = wrap(FileText);
export const Scales = wrap(Scale);
export const Coins = wrap(Coins);
export const BookOpen = wrap(BookOpen);
export const MagnifyingGlass = wrap(Search);
export const UploadSimple = wrap(Upload);
export const Warning = wrap(TriangleAlert);
export const ArrowDown = wrap(ArrowDown);
export const ArrowUp = wrap(ArrowUp);
export const SlidersHorizontal = wrap(SlidersHorizontal);
export const ChartPie = wrap(PieChart);
export const Key = wrap(Key);
