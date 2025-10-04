"use client";
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import StatsCards from './components/StatsCards';
import TabNavigation from './components/TabNavigation';
import UsersTab from './components/UsersTab';
import CoursesTab from './components/CoursesTab';
import CategoriesTab from './components/CategoriesTab';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { SkeletonStats, SkeletonTable } from './components/SkeletonLoader';


export type UserFiltersState = {
  roles: string[];
  provinces: string[];
  categories: string[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  provinsi?: string;
  categories?: string[];
};

export type Course = {
  id: string;
  title: string;
  description: string;
  teacher_name?: string;
  enrolled_count?: number;
  categories?: string[];
};

export type Category = {
  id: string;
  name: string;
  description?: string;
};

export type ImportUserPayload = {
  name: string;
  email: string;
  role: string;
  provinsi: string;
  categories?: string[];
};

export type ImportRowIssue = {
  idx: number;
  errors: string[];
  row: Record<string, unknown>;
};

export type UserSearchField = 'all' | 'name' | 'email' | 'provinsi' | 'category';

const EMPTY_USER_FILTERS: UserFiltersState = { roles: [], provinces: [], categories: [] };

export type CourseFiltersState = {
  categories: string[];
};

const EMPTY_COURSE_FILTERS: CourseFiltersState = { categories: [] };

export default function AdminDashboard() {
  // Deklarasi state tambahan agar error hilang
  const [selectedLabel, setSelectedLabel] = useState('');
  const [selectedCount, setSelectedCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [courseCurrentPage, setCourseCurrentPage] = useState(1);
  const [courseAppliedSearch, setCourseAppliedSearch] = useState('');
  const [searchCourse, setSearchCourse] = useState('');
  const [courseSearchField, setCourseSearchField] = useState<'all' | 'title' | 'teacher'>('all');
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalEnrollments, setTotalEnrollment] = useState(0);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [visibleCourses, setVisibleCourses] = useState<Course[]>([]);
  const [courseTotalPages, setCourseTotalPages] = useState(1);
  const [showCourseCatsModal, setShowCourseCatsModal] = useState(false);
  const [courseCatsOption, setCourseCatsOption] = useState<'selected' | 'all'>('selected');
  const [courseCatSearch, setCourseCatSearch] = useState('');
  const [courseBulkCatSet, setCourseBulkCatSet] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [catForm, setCatForm] = useState({ id: '', name: '', description: '' });
  const [catError, setCatError] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [userCatsMap, setUserCatsMap] = useState<Record<string, string[]>>({});
  const [teacherOptions, setTeacherOptions] = useState<User[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState<{ title: string; description: string; teacher_id: string; id?: string }>({ title: '', description: '', teacher_id: '' });
  const [courseError, setCourseError] = useState('');
  const [courseLoading, setCourseLoading] = useState(false);
  const [showBulkCatsModal, setShowBulkCatsModal] = useState(false);
  const [bulkCatSet, setBulkCatSet] = useState<Set<string>>(new Set());
  const [catsOption, setCatsOption] = useState<'selected' | 'all'>('selected');
  const [catSearch, setCatSearch] = useState('');
  // Toast notification states
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  // Loading states for bulk operations
  const [bulkCatsLoading, setBulkCatsLoading] = useState(false);
  const [showUserCatModal, setShowUserCatModal] = useState(false);
  const [selectedUserForCat, setSelectedUserForCat] = useState<User | null>(null);
  const [userCatSet, setUserCatSet] = useState<Set<string>>(new Set());
  // Individual course category editing states
  const [showCourseCatModal, setShowCourseCatModal] = useState(false);
  const [selectedCourseForCat, setSelectedCourseForCat] = useState<Course | null>(null);
  const [courseCatSet, setCourseCatSet] = useState<Set<string>>(new Set());

  // Course filter modal state
  const [showCourseFilterModal, setShowCourseFilterModal] = useState(false);

  const showToastNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    // Auto hide after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };
  // Deklarasi variabel yang hilang agar error hilang
  const [appliedSearch, setAppliedSearch] = useState('');
  const [searchField, setSearchField] = useState<UserSearchField>('all');
  const [appliedSearchField, setAppliedSearchField] = useState<UserSearchField>('all');
  // ...existing code...
  // Tambahan deklarasi state dan variabel agar error hilang
  const [roleSummary, setRoleSummary] = useState({ admin: 0, teacher: 0, student: 0 });
  // ...existing code...
  const initializedRef = useRef(false);
  // Dummy fetchUsers agar tidak error
  // Fetch users from API
  const fetchUsers = useCallback(async (
    page: number,
    usersPerPage: number,
    appliedSearch: string,
    appliedSearchField: UserSearchField,
    includeSummary: boolean,
    appliedUserFilters: UserFiltersState
  ) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(usersPerPage),
      });

      if (includeSummary) {
        params.set('include_summary', 'true');
      }

      const keyword = appliedSearch.trim();
      if (keyword) {
        params.set('search', keyword);
        if (appliedSearchField !== 'all') {
          params.set('search_field', appliedSearchField);
        }
      }

      if (appliedUserFilters.roles.length > 0) {
        params.set('roles', appliedUserFilters.roles.join(','));
      }

      if (appliedUserFilters.provinces.length > 0) {
        params.set('provinces', appliedUserFilters.provinces.join(','));
      }

      if (appliedUserFilters.categories.length > 0) {
        params.set('category_ids', appliedUserFilters.categories.join(','));
      }

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        // Handle authentication errors
        if (res.status === 401 || res.status === 403) {
          return {
            success: false,
            total: 0,
            maxPage: 1,
            pageOverflow: false,
            roleSummary: { admin: 0, teacher: 0, student: 0 },
            users: [],
            authError: true,
            error: data.error || 'Authentication required',
          };
        }
        return {
          success: false,
          total: 0,
          maxPage: 1,
          pageOverflow: false,
          roleSummary: { admin: 0, teacher: 0, student: 0 },
          users: [],
        };
      }

      const total = data.total ?? 0;
      const maxPage = Math.max(1, Math.ceil(total / usersPerPage));
      const pageOverflow = total > 0 && page > maxPage;

      return {
        success: true,
        total,
        maxPage,
        pageOverflow,
        roleSummary: data.roleSummary || { admin: 0, teacher: 0, student: 0 },
        users: Array.isArray(data.users) ? data.users : [],
      };
    } catch (err) {
      console.error('Gagal memuat data user', err);
      return {
        success: false,
        total: 0,
        maxPage: 1,
        pageOverflow: false,
        roleSummary: { admin: 0, teacher: 0, student: 0 },
        users: [],
      };
    }
  }, []);
  // Deklarasi state dan variabel yang diperlukan agar error hilang
  const [userFilters, setUserFilters] = useState<UserFiltersState>(EMPTY_USER_FILTERS);
  const [appliedUserFilters, setAppliedUserFilters] = useState<UserFiltersState>(EMPTY_USER_FILTERS);
  const [courseFilters, setCourseFilters] = useState<CourseFiltersState>(EMPTY_COURSE_FILTERS);
  const [appliedCourseFilters, setAppliedCourseFilters] = useState<CourseFiltersState>(EMPTY_COURSE_FILTERS);
  const [searchUser, setSearchUser] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Ganti any dengan tipe User jika tersedia
  const [usersLoading, setUsersLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const usersPerPageOptions = [10, 20, 50];
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importCategories, setImportCategories] = useState<Set<string>>(new Set());
  const [importCatSearch, setImportCatSearch] = useState('');
  const [importUsers, setImportUsers] = useState<ImportUserPayload[]>([]);
  const [importIncompleteRows, setImportIncompleteRows] = useState<ImportRowIssue[]>([]);
  const [importInvalidValueRows, setImportInvalidValueRows] = useState<ImportRowIssue[]>([]);
  const [importInvalidRows, setImportInvalidRows] = useState<ImportRowIssue[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'courses' | 'categories'>('users');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Missing state declarations
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', password: '', provinsi: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCourseLabel, setSelectedCourseLabel] = useState('');
  const [coursesPerPage, setCoursesPerPage] = useState(10);
  const coursesPerPageOptions = [10, 20, 50];
  const initialLoadRef = useRef(false);

  // Add missing states
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCourses, setEnrollCourses] = useState<Array<{ id: string; title: string; description: string }>>([]);
  const [selectedEnrollCourseIds, setSelectedEnrollCourseIds] = useState<Set<string>>(new Set());
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [enrollOption, setEnrollOption] = useState<'selected' | 'all'>('selected');

  // Add user state variables
  const [addForm, setAddForm] = useState({ name: '', email: '', role: 'student', password: '', provinsi: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Bulk delete states
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState('');

  // Export states
  const [showExportOptionsModal, setShowExportOptionsModal] = useState(false);
  const [exportOption, setExportOption] = useState<'current' | 'filtered' | 'custom'>('current');
  const [exportFilters, setExportFilters] = useState<UserFiltersState>(EMPTY_USER_FILTERS);
  const [exportSearch, setExportSearch] = useState('');
  const [exportSearchField, setExportSearchField] = useState<UserSearchField>('all');
  const [exportLoading, setExportLoading] = useState(false);

  // Bulk delete states for courses
  const [showBulkDeleteCoursesModal, setShowBulkDeleteCoursesModal] = useState(false);
  const [bulkDeleteCoursesLoading, setBulkDeleteCoursesLoading] = useState(false);
  const [bulkDeleteCoursesError, setBulkDeleteCoursesError] = useState('');

  // Missing functions
  const handleSearchSubmit = useCallback(() => {
    setAppliedSearch(searchUser);
    setAppliedSearchField(searchField);
    setCurrentPage(1);
  }, [searchUser, searchField]);

  const handleCourseSearchSubmit = useCallback(() => {
    setCourseAppliedSearch(searchCourse);
    setAppliedCourseFilters(courseFilters);
    setCourseCurrentPage(1);
  }, [searchCourse, courseFilters]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error', error);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lms_user');
      localStorage.removeItem('user_id');
      localStorage.removeItem('token');
      localStorage.removeItem('enrollment_id');
    }
    window.location.href = '/lms/login';
  };

  const toggleSelectPage = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(users.map(u => u.id));
      setSelectedCount(users.length);
      setSelectedLabel(`${users.length} user dipilih`);
    } else {
      setSelectedUserIds([]);
      setSelectedCount(0);
      setSelectedLabel('');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      const newSelected = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      setSelectedCount(newSelected.length);
      setSelectedLabel(newSelected.length > 0 ? `${newSelected.length} user dipilih` : '');
      return newSelected;
    });
  };

  const toggleSelectAllCourses = (checked: boolean) => {
    if (checked) {
      setSelectedCourseIds(visibleCourses.map(c => c.id));
      setSelectedCourseLabel(`${visibleCourses.length} course dipilih`);
    } else {
      setSelectedCourseIds([]);
      setSelectedCourseLabel('');
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds(prev => {
      const newSelected = prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId];
      setSelectedCourseLabel(newSelected.length > 0 ? `${newSelected.length} course dipilih` : '');
      return newSelected;
    });
  };

  const handleOpenEnrollModal = useCallback(async () => {
    if (showEnrollModal) {
      setShowEnrollModal(false);
      setSelectedEnrollCourseIds(new Set());
      setEnrollError('');
    } else {
      setEnrollLoading(true);
      setEnrollError('');
      try {
        const res = await fetch('/api/admin/courses?limit=1000');
        const data = await res.json();
        if (data.success) {
          setEnrollCourses(data.courses || []);
          setSelectedEnrollCourseIds(new Set());
          setShowEnrollModal(true);
        } else {
          setEnrollError(data.error || 'Gagal memuat daftar course');
        }
      } catch (err) {
        console.error('Gagal memuat course untuk enroll', err);
        setEnrollError('Gagal memuat daftar course');
      } finally {
        setEnrollLoading(false);
      }
    }
  }, [showEnrollModal]);

  const fetchCourses = useCallback(async (
    page: number,
    limit: number,
    search: string,
    filters: CourseFiltersState = EMPTY_COURSE_FILTERS
  ) => {
    setCoursesLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      const keyword = search.trim();
      if (keyword) {
        params.set('search', keyword);
      }
      if (filters.categories.length > 0) {
        params.set('category_ids', filters.categories.join(','));
      }
      const res = await fetch(`/api/admin/courses?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCourses([]);
        setTotalCourses(0);
        setTotalEnrollment(0);
        setError(data.error || 'Gagal memuat data course');
        return { success: false as const, total: 0, maxPage: 1, pageOverflow: false };
      }
      const total = data.total ?? 0;
      const maxPage = Math.max(1, Math.ceil((total || 0) / Math.max(limit, 1)));
      if (total > 0 && page > maxPage) {
        setTotalCourses(total);
        setTotalEnrollment(data.enrollmentTotal ?? 0);
        setCourses([]);
        return { success: true as const, total, maxPage, pageOverflow: true };
      }
      const courseList: Course[] = Array.isArray(data.courses) ? data.courses : [];
      setCourses(courseList);
      setTotalCourses(total);
      setTotalEnrollment(data.enrollmentTotal ?? 0);
      setSelectedCourseIds((prev) => prev.filter((id) => courseList.some((course) => course.id === id)));
      setError('');
      return { success: true as const, total, maxPage, pageOverflow: false };
    } catch (err) {
      console.error('Gagal memuat data course', err);
      setCourses([]);
      setTotalCourses(0);
      setTotalEnrollment(0);
      setError('Gagal memuat data course');
      return { success: false as const, total: 0, maxPage: 1, pageOverflow: false };
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  const reloadCourses = useCallback(async () => {
    setCoursesLoading(true); // Show loading state immediately
    const result = await fetchCourses(courseCurrentPage, coursesPerPage, courseAppliedSearch, appliedCourseFilters);
    if (result.success) {
      setCourseTotalPages(result.maxPage); // Update courseTotalPages
    }
    if (result.pageOverflow && courseCurrentPage !== result.maxPage) {
      setCourseCurrentPage(result.maxPage);
    }
    setCoursesLoading(false); // Hide loading state after completion
    return result;
  }, [fetchCourses, courseCurrentPage, coursesPerPage, courseAppliedSearch, appliedCourseFilters]);

  const reloadUsers = useCallback(
    async (options?: { includeSummary?: boolean }) => {
      const includeSummary = options?.includeSummary ?? true;
      setUsersLoading(true); // Show loading state immediately

      const result = await fetchUsers(
        currentPage,
        usersPerPage,
        appliedSearch,
        appliedSearchField,
        includeSummary,
        appliedUserFilters
      );
      if (result.pageOverflow && currentPage !== result.maxPage) {
        setCurrentPage(result.maxPage);
      }

      // Update state directly
      if (result.success) {
        setRoleSummary(result.roleSummary);
        setUsers(result.users);
        setTotalUsers(result.total);
        setTotalPages(result.maxPage); // Update totalPages
        setError('');

        // userCatsMap will be updated by useEffect when categories/users change
      } else if (result.authError) {
        setError('Silakan login terlebih dahulu untuk mengakses halaman admin');
        setUsers([]);
        setTotalUsers(0);
        setTotalPages(1); // Reset totalPages
      } else {
        setUsers([]);
        setTotalUsers(0);
        setTotalPages(1); // Reset totalPages
        setError('Gagal memuat data user');
      }
      setUsersLoading(false);

      return result;
    },
    [fetchUsers, currentPage, usersPerPage, appliedSearch, appliedSearchField, appliedUserFilters]
  );

  const reloadCategories = useCallback(async () => {
    try {
      setCatLoading(true);
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      } else {
        setCatError(data.error || 'Gagal memuat kategori');
      }
    } catch {
      setCatError('Gagal memuat kategori');
    }
    setCatLoading(false);
  }, []);

  const reloadTeacherOptions = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: '1', limit: '500', role: 'teacher', include_summary: 'false' });
      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTeacherOptions(Array.isArray(data.users) ? data.users : []);
      }
    } catch (err) {
      console.error('Gagal memuat data teacher', err);
    }
  }, []);

  const fetchAllUsersMatching = useCallback(async (search: string, filters: UserFiltersState) => {
    const collected: User[] = [];
    const limit = 200;
    let page = 1;
    let total = 0;
    const keyword = search.trim();
    while (true) {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        include_summary: 'false',
      });
      if (keyword) {
        params.set('search', keyword);
      }
      if (filters.roles.length > 0) {
        params.set('roles', filters.roles.join(','));
      }
      if (filters.provinces.length > 0) {
        params.set('provinces', filters.provinces.join(','));
      }
      // batches removed
      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memuat daftar user');
      }
      const chunk: User[] = Array.isArray(data.users) ? data.users : [];
      collected.push(...chunk);
      total = data.total ?? collected.length;
      if (collected.length >= total || chunk.length === 0) {
        break;
      }
      page += 1;
      if (page > 500) {
        break;
      }
    }
    return { users: collected, total };
  }, []);

  const fetchAllUserIds = useCallback(async (search: string, filters: UserFiltersState) => {
    const { users } = await fetchAllUsersMatching(search, filters);
    return users.map((u) => u.id);
  }, [fetchAllUsersMatching]);

  const fetchAllCoursesMatching = useCallback(async (search: string, filters: CourseFiltersState = EMPTY_COURSE_FILTERS) => {
    const collected: Course[] = [];
    const limit = 200;
    let page = 1;
    let total = 0;
    const keyword = search.trim();
    while (true) {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (keyword) {
        params.set('search', keyword);
      }
      if (filters.categories.length > 0) {
        params.set('category_ids', filters.categories.join(','));
      }
      const res = await fetch(`/api/admin/courses?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memuat daftar course');
      }
      const chunk: Course[] = Array.isArray(data.courses) ? data.courses : [];
      collected.push(...chunk);
      total = data.total ?? collected.length;
      if (collected.length >= total || chunk.length === 0) {
        break;
      }
      page += 1;
      if (page > 500) {
        break;
      }
    }
    return { courses: collected, total };
  }, []);

  const fetchAllCourseIds = useCallback(async (search: string, filters: CourseFiltersState = EMPTY_COURSE_FILTERS) => {
    const { courses } = await fetchAllCoursesMatching(search, filters);
    return courses.map((course) => course.id);
  }, [fetchAllCoursesMatching]);

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    const loadData = async () => {
      setLoading(true);
      setError('');
      setCurrentPage(1);
      setAppliedSearch('');
      setCourseCurrentPage(1);
      setCourseAppliedSearch('');
      setSearchCourse('');
      try {
        const [userResult] = await Promise.all([
          fetchUsers(1, usersPerPage, '', 'all', true, EMPTY_USER_FILTERS),
          reloadCourses(),
          reloadCategories(),
          reloadTeacherOptions(),
        ]);
        // Handle user data from fetchUsers
        if (userResult.success) {
          setRoleSummary(userResult.roleSummary);
          setUsers(userResult.users);
          setTotalUsers(userResult.total);
          setTotalPages(userResult.maxPage); // Update totalPages

          // userCatsMap will be updated by useEffect when categories/users change
        } else if (userResult.authError) {
          setError('Silakan login terlebih dahulu untuk mengakses halaman admin');
        } else {
          setUsers([]);
          setTotalUsers(0);
          setTotalPages(1); // Reset totalPages
          setError('Gagal memuat data user');
        }
        setUsersLoading(false);
        initializedRef.current = true;
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchUsers, reloadCourses, reloadCategories, reloadTeacherOptions, usersPerPage]);

  useEffect(() => {
    if (!initializedRef.current) return;
    let active = true;
    (async () => {
      const result = await fetchUsers(
        currentPage,
        usersPerPage,
        appliedSearch,
        appliedSearchField,
        true,
        appliedUserFilters
      );
      if (!active) return;
      if (result.success) {
        setRoleSummary(result.roleSummary);
        setUsers(result.users);
        setTotalUsers(result.total);
        setTotalPages(result.maxPage); // Update totalPages
        setError('');

        // userCatsMap will be updated by useEffect when categories/users change
      } else if (result.authError) {
        setError('Silakan login terlebih dahulu untuk mengakses halaman admin');
        setUsers([]);
        setTotalUsers(0);
        setTotalPages(1); // Reset totalPages
      } else {
        setUsers([]);
        setTotalUsers(0);
        setTotalPages(1); // Reset totalPages
        setError('Gagal memuat data user');
      }
      setUsersLoading(false);
      if (result.pageOverflow && currentPage !== result.maxPage) {
        setCurrentPage(result.maxPage);
      }
    })();
    return () => {
      active = false;
    };
    }, [fetchUsers, currentPage, usersPerPage, appliedSearch, appliedSearchField, appliedUserFilters]);  useEffect(() => {
    if (!initializedRef.current) return;
    let active = true;
    setCoursesLoading(true); // Set loading state before fetching
    (async () => {
      const result = await fetchCourses(courseCurrentPage, coursesPerPage, courseAppliedSearch, appliedCourseFilters);
      if (!active) return;
      if (result.success) {
        setCourseTotalPages(result.maxPage); // Update courseTotalPages
      }
      if (result.pageOverflow && courseCurrentPage !== result.maxPage) {
        setCourseCurrentPage(result.maxPage);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchCourses, courseCurrentPage, coursesPerPage, courseAppliedSearch, appliedCourseFilters]);

  // Load category chips for courses in filtered list (visible table rows)
  // NOTE: Categories are now loaded directly with course data, so this useEffect is no longer needed
  // useEffect(() => {
  //   const loadCourseCats = async () => {
  //     if (visibleCourses.length === 0) return;
  //     if (lastCourseIdsRef.current === courseIdsKey) return; // Already loaded for these courses

  //     if (categories.length === 0) {
  //       const empty = buildEmptyCategoryRecord(visibleCourses.map(c => c.id));
  //       setCourseCatsMap((prev) => ({ ...prev, ...empty }));
  //       lastCourseIdsRef.current = courseIdsKey;
  //       return;
  //     }
  //     try {
  //       const params = new URLSearchParams({ course_ids: visibleCourses.map(c => c.id).join(',') });
  //       const res = await fetch(`/api/categories/assign-course?${params.toString()}`);
  //       const data = await res.json();
  //       const assignments: Record<string, string[]> = data.assignments || {};
  //       const nameById = Object.fromEntries(categories.map((c) => [c.id, c.name] as const));
  //       const mapped: Record<string, string[]> = {};
  //       visibleCourses.forEach((course) => {
  //         const catIds = Array.isArray(assignments[course.id]) ? assignments[course.id] : [];
  //         mapped[course.id] = catIds.map((catId) => nameById[catId]).filter(Boolean);
  //       });
  //       setCourseCatsMap((prev) => ({ ...prev, ...mapped }));
  //       lastCourseIdsRef.current = courseIdsKey;
  //     } catch (err) {
  //       console.error('Gagal memuat kategori course', err);
  //       const fallback = buildEmptyCategoryRecord(visibleCourses.map(c => c.id));
  //       setCourseCatsMap((prev) => ({ ...prev, ...fallback }));
  //       lastCourseIdsRef.current = courseIdsKey;
  //     }
  //   };
  //   loadCourseCats();
  // }, [courseIdsKey, categories, courseCatsReloadTrigger]);

  // Update totalPages when totalUsers or usersPerPage changes
  useEffect(() => {
    if (totalUsers > 0 && usersPerPage > 0) {
      const newTotalPages = Math.max(1, Math.ceil(totalUsers / usersPerPage));
      setTotalPages(newTotalPages);
      
      // If current page exceeds new total pages, go to last page
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
      }
    }

                     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalUsers, usersPerPage]);

  // Update courseTotalPages when totalCourses or coursesPerPage changes
  useEffect(() => {
    if (totalCourses > 0 && coursesPerPage > 0) {
      const newTotalPages = Math.max(1, Math.ceil(totalCourses / coursesPerPage));
      setCourseTotalPages(newTotalPages);
      
      // If current page exceeds new total pages, go to last page
      if (courseCurrentPage > newTotalPages) {
        setCourseCurrentPage(newTotalPages);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCourses, coursesPerPage]);

  // Update user categories map when categories change
  useEffect(() => {
    if (categories.length > 0 && users.length > 0) {
      const newUserCatsMap: Record<string, string[]> = {};
      users.forEach((user: User & { categories?: string[] }) => {
        // Categories are now already converted to names in the API response
        newUserCatsMap[user.id] = user.categories || [];
      });
      setUserCatsMap(newUserCatsMap);
    }
  }, [categories, users]);

  // Set visibleCourses to courses (similar to how users work)
  useEffect(() => {
    setVisibleCourses(courses);
  }, [courses]);

  const handleSaveCategory = async () => {
    setCatError('');
    if (!catForm.name.trim()) {
      setCatError('Nama kategori wajib diisi');
      return;
    }
    try {
      const method = catForm.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catForm),
      });
      const data = await res.json();
      if (data.success) {
        setCatForm({ id: '', name: '', description: '' });
        await reloadCategories();
      } else {
        setCatError(data.error || 'Gagal menyimpan kategori');
      }
    } catch {
      setCatError('Gagal menyimpan kategori');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return;
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        await reloadCategories();
      } else {
        alert(data.error || 'Gagal hapus kategori');
      }
    } catch {
      alert('Gagal hapus kategori');
    }
  };

  const saveUserCats = async () => {
    if (!selectedUserForCat) return;

    setBulkCatsLoading(true); // Reuse the loading state
    try {
      // Get current categories as names from the user data
      const currentCatNames = selectedUserForCat.categories || [];
      
      // Convert current category names to IDs
      const currentCatIds = categories
        .filter(cat => currentCatNames.includes(cat.name))
        .map(cat => cat.id);

      // Selected category IDs from the modal
      const newCatIds = Array.from(userCatSet);

      // Categories to add (in new set but not in current)
      const toAdd = newCatIds.filter(id => !currentCatIds.includes(id));

      // Categories to remove (in current but not in new)
      const toRemove = currentCatIds.filter(id => !newCatIds.includes(id));

      // Perform assignments
      const assignPromises = toAdd.map(catId =>
        fetch('/api/admin/categories/assign-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: selectedUserForCat.id, category_id: catId }),
        }).then(res => res.json())
      );

      // Perform unassignments
      const unassignPromises = toRemove.map(catId =>
        fetch('/api/admin/categories/assign-user', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: selectedUserForCat.id, category_id: catId }),
        }).then(res => res.json())
      );

      const allPromises = [...assignPromises, ...unassignPromises];
      const results = await Promise.all(allPromises);

      const failedCount = results.filter(result => !result.success).length;

      if (failedCount > 0) {
        showToastNotification(`Gagal menyimpan ${failedCount} perubahan kategori. Coba lagi.`, 'error');
        return;
      }

      // Wait a bit longer to ensure database is fully committed
      await new Promise(resolve => setTimeout(resolve, 500));

      // Tutup modal dan refresh tabel + chips
      setShowUserCatModal(false);
      setSelectedUserForCat(null);
      setUserCatSet(new Set());
      await Promise.all([reloadUsers({ includeSummary: false }), reloadCategories()]);
      showToastNotification(`Berhasil menyimpan perubahan kategori untuk ${selectedUserForCat.name}.`);
    } catch (err) {
      console.error('Error saving user categories:', err);
      showToastNotification('Gagal menyimpan kategori. Coba lagi.', 'error');
    } finally {
      setBulkCatsLoading(false);
    }
  };

  const openCourseCatsModal = async () => {
    setCourseBulkCatSet(new Set());
    setCourseCatSearch('');
    setCourseCatsOption(selectedCourseIds.length > 0 ? 'selected' : 'all');
    await reloadCategories();
    setShowCourseCatsModal(true);
  };

  const saveBulkCourseCats = async () => {
    let targetIds: string[] = [];
    if (courseCatsOption === 'all') {
      try {
        targetIds = await fetchAllCourseIds(courseAppliedSearch, appliedCourseFilters);
      } catch (err) {
        console.error('Gagal mengambil daftar course', err);
        alert('Gagal mengambil daftar course. Coba lagi.');
        return;
      }
    } else {
      targetIds = selectedCourseIds;
    }
    if (targetIds.length === 0) {
      alert('Pilih minimal satu course.');
      return;
    }
    try {
      await Promise.all(targetIds.flatMap((courseId) => (
        [
          ...categories.map((c) => fetch('/api/categories/assign-course', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_id: courseId, category_id: c.id }),
          })),
          ...Array.from(courseBulkCatSet).map((id) => fetch('/api/categories/assign-course', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_id: courseId, category_id: id }),
          })),
        ]
      )));
      setShowCourseCatsModal(false);
      if (courseCatsOption === 'selected') {
        setSelectedCourseIds([]);
      }
      setCourseBulkCatSet(new Set());
      await Promise.all([reloadCourses(), reloadCategories()]);
    } catch (err) {
      console.error('Gagal menyimpan kategori course', err);
      alert('Gagal menyimpan kategori untuk course.');
    }
  };

  const openCourseCatModal = (course: Course) => {
    setSelectedCourseForCat(course);
    // Initialize courseCatSet with current categories for this course
    // Categories are now directly available in course.categories as array of names
    const currentCatNames = course.categories || [];
    const catIds = categories
      .filter(cat => currentCatNames.includes(cat.name))
      .map(cat => cat.id);
    setCourseCatSet(new Set(catIds));
    setShowCourseCatModal(true);
  };

  const saveCourseCats = async () => {
    if (!selectedCourseForCat) return;

    setBulkCatsLoading(true); // Reuse the loading state
    try {
      const currentCatNames = selectedCourseForCat.categories || [];
      const currentCatIds = categories
        .filter(cat => currentCatNames.includes(cat.name))
        .map(cat => cat.id);

      const currentCatSet = new Set(currentCatIds);
      const newCatSet = courseCatSet;

      // Categories to add (in new set but not in current)
      const toAdd = Array.from(newCatSet).filter(id => !currentCatSet.has(id));

      // Categories to remove (in current but not in new)
      const toRemove = Array.from(currentCatSet).filter(id => !newCatSet.has(id));

      // Perform assignments
      const assignPromises = toAdd.map(catId =>
        fetch('/api/categories/assign-course', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_id: selectedCourseForCat.id, category_id: catId }),
        }).then(res => res.json())
      );

      // Perform unassignments
      const unassignPromises = toRemove.map(catId =>
        fetch('/api/categories/assign-course', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_id: selectedCourseForCat.id, category_id: catId }),
        }).then(res => res.json())
      );

      const allPromises = [...assignPromises, ...unassignPromises];
      const results = await Promise.all(allPromises);

      const failedCount = results.filter(result => !result.success).length;

      if (failedCount > 0) {
        showToastNotification(`Gagal menyimpan ${failedCount} perubahan kategori. Coba lagi.`, 'error');
        return;
      }

      // Wait a bit longer to ensure database is fully committed
      await new Promise(resolve => setTimeout(resolve, 500));

      // Tutup modal dan refresh tabel + chips
      setShowCourseCatModal(false);
      setSelectedCourseForCat(null);
      setCourseCatSet(new Set());
      await Promise.all([reloadCourses(), reloadCategories()]);
      showToastNotification(`Berhasil menyimpan perubahan kategori untuk course "${selectedCourseForCat.title}".`);
    } catch (err) {
      console.error('Error saving course categories:', err);
      showToastNotification('Gagal menyimpan kategori. Coba lagi.', 'error');
    } finally {
      setBulkCatsLoading(false);
    }
  };

  const toggleBulkCatsModal = async () => {
    if (showBulkCatsModal) {
      // Close modal
      setShowBulkCatsModal(false);
      setBulkCatSet(new Set());
      setCatError('');
    } else {
      // Open modal
      setBulkCatSet(new Set());
      setCatError('');
      setCatsOption(selectedUserIds.length > 0 ? 'selected' : 'all');
      setCatSearch('');
      await reloadCategories();
      setShowBulkCatsModal(true);
    }
  };

  const saveBulkUserCats = async () => {
    let targetIds: string[] = [];
    if (catsOption === 'all') {
      try {
        targetIds = await fetchAllUserIds(appliedSearch, appliedUserFilters);
      } catch (err) {
        console.error('Gagal mengambil seluruh user untuk kategori', err);
        showToastNotification('Gagal mengambil daftar user. Coba lagi atau batasi pencarian.', 'error');
        return;
      }
    } else {
      targetIds = selectedUserIds;
    }
    if (targetIds.length === 0) {
      showToastNotification('Pilih minimal satu user untuk assign kategori.', 'error');
      return;
    }

    setBulkCatsLoading(true);
    try {
      // Add selected categories to users (don't remove existing ones)
      const assignPromises = targetIds.flatMap(userId => (
        Array.from(bulkCatSet).map(id => fetch('/api/admin/categories/assign-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, category_id: id }),
        }).then(res => res.json()))
      ));

      const assignResults = await Promise.all(assignPromises);
      const failedCount = assignResults.filter(result => !result.success).length;

      if (failedCount > 0) {
        showToastNotification(`Gagal menambahkan kategori ke ${failedCount} user. Coba lagi.`, 'error');
        return;
      }

      // Wait a bit longer to ensure database is fully committed
      await new Promise(resolve => setTimeout(resolve, 500));

      // Tutup modal dan refresh tabel + chips
      setShowBulkCatsModal(false);
      setSelectedUserIds([]);
      await Promise.all([reloadUsers({ includeSummary: false }), reloadCategories()]);
      showToastNotification(`Berhasil menambahkan ${bulkCatSet.size} kategori ke ${targetIds.length} user.`);
    } catch (err) {
      console.error('Error saving bulk categories:', err);
      showToastNotification('Gagal menyimpan kategori. Coba lagi.', 'error');
    } finally {
      setBulkCatsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.role) {
      setAddError('Nama, email, dan role wajib diisi');
      return;
    }

    setAddLoading(true);
    setAddError('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });

      const data = await res.json();

      if (data.success) {
        setShowAddModal(false);
        setAddForm({ name: '', email: '', role: 'student', password: '', provinsi: '' });
        await reloadUsers({ includeSummary: true });
      } else {
        setAddError(data.error || 'Gagal menambah user');
      }
    } catch (err) {
      console.error('Add user error:', err);
      setAddError('Gagal menambah user');
    } finally {
      setAddLoading(false);
    }
  };

  const resetImportState = () => {
    setImportUsers([]);
    setImportIncompleteRows([]);
    setImportInvalidValueRows([]);
    setImportInvalidRows([]);
    setImportError('');
    setImportCategories(new Set());
    setImportCatSearch('');
  };

  const handleConfirmImport = async () => {
    if (importUsers.length === 0) {
      setImportError('Tidak ada data valid untuk diimport');
      return;
    }

    setImportLoading(true);
    setImportError('');

    try {
      const payload = {
        users: importUsers.map(user => ({
          name: user.name,
          email: user.email,
          role: user.role,
          provinsi: user.provinsi,
          password: '',
        })),
      };

      const res = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data && data.success) {
        // Assign categories if selected
        if (importCategories.size > 0 && data.created && Array.isArray(data.created)) {
          try {
            const assignPromises = data.created.flatMap((user: { id: string }) => (
              Array.from(importCategories).map(catId => fetch('/api/admin/categories/assign-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, category_id: catId }),
              }))
            ));

            const assignResults = await Promise.allSettled(assignPromises);
            const failedCount = assignResults.filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.ok)).length;

            if (failedCount > 0) {
              showToastNotification(`User berhasil diimport, tetapi ${failedCount} assignment kategori gagal.`, 'error');
            } else {
              showToastNotification(`Berhasil import ${data.created.length} user dan menambahkan ${importCategories.size} kategori.`);
            }
          } catch (catErr) {
            console.error('Gagal assign kategori setelah import', catErr);
            showToastNotification('User berhasil diimport, tetapi gagal menambahkan kategori.', 'error');
          }
        } else {
          showToastNotification(`Berhasil import ${data.created?.length || importUsers.length} user.`);
        }

        setShowImportModal(false);
        resetImportState();

        // Reload users and trigger category chips reload
        await reloadUsers({ includeSummary: true });
      } else {
        const errorMessage = data?.error || 'Gagal mengimport user';
        setImportError(errorMessage);
      }
    } catch (err) {
      console.error('Confirm import error:', err);
      setImportError('Gagal mengimport user');
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportFileChange = async (file: File | null) => {
    resetImportState();
    setImportError('');

    if (!file) {
      return;
    }

    setImportLoading(true);

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        setImportError('Sheet pada file Excel tidak ditemukan.');
        setImportLoading(false);
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

      const validUsers: ImportUserPayload[] = [];
      const incomplete: ImportRowIssue[] = [];
      const invalidValues: ImportRowIssue[] = [];

      rows.forEach((row, idx) => {
        const rowNumber = idx + 2; // header berada pada baris pertama
        const nama = ((row.nama ?? row.Nama) as string | undefined)?.toString().trim() ?? '';
        const email = ((row.email ?? row.Email) as string | undefined)?.toString().trim() ?? '';
        const role = ((row.role ?? row.Role) as string | undefined)?.toString().trim() ?? '';
        const provinsi = ((row.provinsi ?? row.Provinsi) as string | undefined)?.toString().trim() ?? '';

        const missingFieldErrors: string[] = [];
        if (!nama) missingFieldErrors.push('Kolom "nama" kosong');
        if (!email) missingFieldErrors.push('Kolom "email" kosong');
        if (!role) missingFieldErrors.push('Kolom "role" kosong');
        if (!provinsi) missingFieldErrors.push('Kolom "provinsi" kosong');

        if (missingFieldErrors.length > 0) {
          incomplete.push({ idx: rowNumber, errors: missingFieldErrors, row });
          return;
        }

        const valueErrors: string[] = [];
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          valueErrors.push('Format email tidak valid');
        }
        if (!['student', 'teacher', 'admin'].includes(role.toLowerCase())) {
          valueErrors.push('Role harus student/teacher/admin');
        }

        if (valueErrors.length > 0) {
          invalidValues.push({ idx: rowNumber, errors: valueErrors, row: { nama, email, role, provinsi } });
          return;
        }

        validUsers.push({
          name: nama,
          email,
          role: role.toLowerCase(),
          provinsi,
        });
      });

      setImportUsers(validUsers);
      setImportIncompleteRows(incomplete);
      setImportInvalidValueRows(invalidValues);
      setImportInvalidRows([...incomplete, ...invalidValues]);

      if (validUsers.length === 0) {
        setImportError('File tidak mengandung data valid. Pastikan kolom nama, email, role, dan provinsi terisi dengan benar.');
      }
    } catch (error) {
      console.error('Import setup error:', error);
      setImportError('Gagal memproses file. Pastikan format Excel benar.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportUsers = async () => {
    // Open export options modal instead of directly exporting
    setShowExportOptionsModal(true);
  };

  const handleExportWithOptions = async () => {
    setExportLoading(true);
    try {
      let searchToUse = '';
      let filtersToUse: UserFiltersState = EMPTY_USER_FILTERS;

      if (exportOption === 'current') {
        // Export currently displayed data
        searchToUse = appliedSearch;
        filtersToUse = appliedUserFilters;
      } else if (exportOption === 'filtered') {
        // Export filtered data (same as current but with applied filters)
        searchToUse = appliedSearch;
        filtersToUse = appliedUserFilters;
      } else if (exportOption === 'custom') {
        // Export with custom filters
        searchToUse = exportSearch;
        filtersToUse = exportFilters;
      }

      // Get all user IDs matching the criteria
      const { users } = await fetchAllUsersMatching(searchToUse, filtersToUse);
      const userIds = users.map(u => u.id);

      if (userIds.length === 0) {
        alert('Tidak ada user yang sesuai dengan kriteria export');
        return;
      }

      const params = new URLSearchParams({
        user_ids: userIds.join(','),
        include_categories: 'true'
      });

      const res = await fetch(`/api/admin/users/export?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Gagal mengunduh file');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${exportOption}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Close modal and reset state
      setShowExportOptionsModal(false);
      setExportOption('current');
      setExportFilters(EMPTY_USER_FILTERS);
      setExportSearch('');
      setExportSearchField('all');

      showToastNotification(`Berhasil export ${userIds.length} user.`);
    } catch (err) {
      console.error('Export users error:', err);
      alert('Gagal mengexport user');
    } finally {
      setExportLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!editUser) return;

    setEditLoading(true);
    setEditError('');

    try {
      const updateData: {
        name: string;
        email: string;
        role: string;
        provinsi: string;
        password?: string;
      } = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        provinsi: editForm.provinsi,
      };

      // Only include password if it's provided
      if (editForm.password && editForm.password.trim()) {
        updateData.password = editForm.password;
      }

      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editUser.id, ...updateData }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShowEditModal(false);
        setEditUser(null);
        await reloadUsers({ includeSummary: true });
      } else {
        setEditError(data.error || 'Gagal mengedit user');
      }
    } catch (err) {
      console.error('Edit user error:', err);
      setEditError('Gagal mengedit user');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;

    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/users?id=${deleteUser.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShowDeleteModal(false);
        setDeleteUser(null);
        await reloadUsers({ includeSummary: true });
      } else {
        alert(data.error || 'Gagal menghapus user');
      }
    } catch (err) {
      console.error('Delete user error:', err);
      alert('Gagal menghapus user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDeleteModalToggle = () => {
    if (showBulkDeleteModal) {
      setShowBulkDeleteModal(false);
      setBulkDeleteError('');
    } else {
      setShowBulkDeleteModal(true);
      setBulkDeleteError('');
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUserIds.length === 0) return;

    setBulkDeleteLoading(true);
    setBulkDeleteError('');

    try {
      const res = await fetch('/api/users/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: selectedUserIds }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShowBulkDeleteModal(false);
        setSelectedUserIds([]);
        setSelectedCount(0);
        setSelectedLabel('');
        await reloadUsers({ includeSummary: true });
        showToastNotification(`Berhasil menghapus ${selectedUserIds.length} user.`);
      } else {
        setBulkDeleteError(data.error || 'Gagal menghapus user');
      }
    } catch (err) {
      console.error('Bulk delete users error:', err);
      setBulkDeleteError('Gagal menghapus user');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const fetchParticipants = async (courseId: string) => {
    try {
      setParticipantsLoading(true);
      const res = await fetch(`/api/admin/courses/${courseId}/participants`);
      const data = await res.json();
      if (data.success) {
        setParticipants(data.participants || []);
        setParticipantsError('');
      } else {
        setParticipants([]);
        setParticipantsError(data.error || 'Gagal memuat peserta');
      }
    } catch (err) {
      console.error('Fetch participants error:', err);
      setParticipants([]);
      setParticipantsError('Gagal memuat peserta');
    } finally {
      setParticipantsLoading(false);
    }
  };

  const handleBulkDeleteCourses = async () => {
    if (selectedCourseIds.length === 0) return;

    setBulkDeleteCoursesLoading(true);
    setBulkDeleteCoursesError('');

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_ids: selectedCourseIds }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShowBulkDeleteCoursesModal(false);
        setSelectedCourseIds([]);
        setSelectedCourseLabel('');
        await reloadCourses();
        showToastNotification(`Berhasil menghapus ${selectedCourseIds.length} course.`);
      } else {
        setBulkDeleteCoursesError(data.error || 'Gagal menghapus course');
      }
    } catch (err) {
      console.error('Bulk delete courses error:', err);
      setBulkDeleteCoursesError('Gagal menghapus course');
    } finally {
      setBulkDeleteCoursesLoading(false);
    }
  };

  const handleCourseSubmit = async () => {
    setCourseError('');
    if (!courseForm.title.trim()) {
      setCourseError('Judul course wajib diisi');
      return;
    }
    if (!courseForm.teacher_id) {
      setCourseError('Teacher wajib dipilih');
      return;
    }

    try {
      setCourseLoading(true);
      const method = courseForm.id ? 'PUT' : 'POST';
      const endpoint = courseForm.id ? `/api/admin/courses/${courseForm.id}` : '/api/admin/courses';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseForm),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddCourseModal(false);
        setCourseForm({ title: '', description: '', teacher_id: '' });
        await reloadCourses();
      } else {
        setCourseError(data.error || 'Gagal menyimpan course');
      }
    } catch (err) {
      console.error('Course submit error:', err);
      setCourseError('Gagal menyimpan course');
    } finally {
      setCourseLoading(false);
    }
  };

  // ...existing code for UI and modals...
  return (
    <Fragment>
      <AdminHeader onLogout={handleLogout} />
      <main className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 px-4 pb-16">
        <div className="mx-auto w-full max-w-6xl space-y-8 pt-10">
          <ErrorBoundary>
            {loading ? (
              <SkeletonStats />
            ) : (
              <StatsCards
                totalUsers={totalUsers}
                totalCourses={totalCourses}
                totalEnrollments={totalEnrollments}
                roleSummary={roleSummary}
              />
            )}
          </ErrorBoundary>

          <section className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
              <LoadingSpinner size="lg" />
              <p className="text-sm font-medium">Sedang memuat data terbaru...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-6 text-center text-red-600 font-semibold">{error}</div>
          ) : (
            <ErrorBoundary>
              <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

              {activeTab === 'users' && (
                <ErrorBoundary>
                  {usersLoading ? (
                    <div className="space-y-4">
                      <SkeletonTable rows={10} columns={5} />
                    </div>
                  ) : (
                    <UsersTab
                      users={users}
                      usersLoading={usersLoading}
                      totalUsers={totalUsers}
                      currentPage={currentPage}
                      usersPerPage={usersPerPage}
                      usersPerPageOptions={usersPerPageOptions}
                      selectedUserIds={selectedUserIds}
                      selectedCount={selectedCount}
                      selectedLabel={selectedLabel}
                      appliedUserFilters={appliedUserFilters}
                      userFilters={userFilters}
                      searchUser={searchUser}
                      searchField={searchField}
                      categories={categories}
                      userCatsMap={userCatsMap}
                      totalPages={totalPages}
                      showFilterModal={showFilterModal}
                      showAddModal={showAddModal}
                      showImportModal={showImportModal}
                      showEditModal={showEditModal}
                      showDeleteModal={showDeleteModal}
                      showBulkCatsModal={showBulkCatsModal}
                      showUserCatModal={showUserCatModal}
                      selectedUserForCat={selectedUserForCat}
                      userCatSet={userCatSet}
                      editUser={editUser}
                      deleteUser={deleteUser}
                      importUsers={importUsers}
                      importIncompleteRows={importIncompleteRows}
                      importInvalidValueRows={importInvalidValueRows}
                      importInvalidRows={importInvalidRows}
                      importLoading={importLoading}
                      importError={importError}
                      importCategories={importCategories}
                      importCatSearch={importCatSearch}
                      addForm={addForm}
                      addLoading={addLoading}
                      addError={addError}
                      editForm={editForm}
                      editLoading={editLoading}
                      editError={editError}
                      deleteLoading={deleteLoading}
                      showEnrollModal={showEnrollModal}
                      enrollCourses={enrollCourses}
                      enrollLoading={enrollLoading}
                      enrollError={enrollError}
                      selectedEnrollCourseIds={selectedEnrollCourseIds}
                      onSelectedEnrollCourseIdsChange={setSelectedEnrollCourseIds}
                      catSearch={catSearch}
                      bulkCatSet={bulkCatSet}
                      catsOption={catsOption}
                      enrollOption={enrollOption}
                      onEnrollOptionChange={setEnrollOption}
                      bulkCatsLoading={bulkCatsLoading}
                      onSearchChange={setSearchUser}
                      onSearchFieldChange={setSearchField}
                      onSearchSubmit={handleSearchSubmit}
                      onFilterModalToggle={() => setShowFilterModal(prev => !prev)}
                      onAddModalToggle={() => setShowAddModal(prev => !prev)}
                      onImportModalToggle={() => setShowImportModal(prev => !prev)}
                      onEditModalToggle={(user) => {
                        if (user) {
                          setEditUser(user);
                          setEditForm({ name: user.name, email: user.email, role: user.role, password: '', provinsi: user.provinsi || '' });
                          setShowEditModal(true);
                        } else {
                          setShowEditModal(false);
                          setEditUser(null);
                        }
                      }}
                      onDeleteModalToggle={(user) => {
                        if (user) {
                          setDeleteUser(user);
                          setShowDeleteModal(true);
                        } else {
                          setShowDeleteModal(false);
                          setDeleteUser(null);
                        }
                      }}
                      onBulkCatsModalToggle={toggleBulkCatsModal}
                      onUserCatModalToggle={async (user) => {
                        if (user) {
                          // Reload categories to ensure we have the latest data
                          await reloadCategories();
                          setSelectedUserForCat(user);
                          // Initialize userCatSet with current categories for this user
                          // Categories are now already names in user.categories
                          const currentCats = user.categories || [];
                          const catIds = categories
                            .filter(cat => currentCats.includes(cat.name))
                            .map(cat => cat.id);
                          setUserCatSet(new Set(catIds));
                          setShowUserCatModal(true);
                        } else {
                          setShowUserCatModal(false);
                          setSelectedUserForCat(null);
                          setUserCatSet(new Set());
                        }
                      }}
                      onImportFileChange={handleImportFileChange}
                      onAddFormChange={(field, value) => setAddForm(prev => ({ ...prev, [field]: value }))}
                      onAddUser={handleAddUser}
                      onUserFiltersChange={setUserFilters}
                      onAppliedUserFiltersChange={setAppliedUserFilters}
                      onPageChange={setCurrentPage}
                      onUsersPerPageChange={(value) => { setUsersPerPage(value); setCurrentPage(1); }}
                      onSelectAllToggle={toggleSelectPage}
                      onUserSelectionToggle={toggleUserSelection}
                      onExportUsers={handleExportUsers}
                      onEnrollModalOpen={handleOpenEnrollModal}
                      onEnrollUsers={async () => {
                        if (selectedEnrollCourseIds.size === 0) {
                          setEnrollError('Pilih minimal satu course untuk enroll');
                          return;
                        }

                        let targetUserIds: string[] = [];
                        if (enrollOption === 'selected') {
                          targetUserIds = selectedUserIds;
                        } else {
                          // Enroll all users
                          try {
                            const { users } = await fetchAllUsersMatching(appliedSearch, appliedUserFilters);
                            targetUserIds = users.map(u => u.id);
                          } catch (err) {
                            console.error('Gagal mengambil daftar user untuk enroll', err);
                            setEnrollError('Gagal mengambil daftar user');
                            return;
                          }
                        }

                        if (targetUserIds.length === 0) {
                          setEnrollError('Tidak ada user yang dipilih untuk enroll');
                          return;
                        }

                        setEnrollLoading(true);
                        setEnrollError('');

                        try {
                          // Perform bulk enrollment
                          const enrollPromises = [];
                          for (const userId of targetUserIds) {
                            for (const courseId of selectedEnrollCourseIds) {
                              enrollPromises.push(
                                fetch('/api/enroll', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ user_id: userId, course_id: courseId }),
                                })
                              );
                            }
                          }

                          const results = await Promise.allSettled(enrollPromises);
                          const failedCount = results.filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.ok)).length;

                          if (failedCount > 0) {
                            setEnrollError(`Gagal enroll ${failedCount} dari ${enrollPromises.length} enrollment`);
                            showToastNotification(`Gagal enroll ${failedCount} dari ${enrollPromises.length} enrollment.`, 'error');
                          } else {
                            setShowEnrollModal(false);
                            setSelectedEnrollCourseIds(new Set());
                            showToastNotification(`Berhasil enroll ${targetUserIds.length} user ke ${selectedEnrollCourseIds.size} course.`);
                            // Refresh data if needed
                            await reloadUsers({ includeSummary: false });
                          }
                        } catch (err) {
                          console.error('Enroll users error:', err);
                          setEnrollError('Gagal melakukan enrollment');
                        } finally {
                          setEnrollLoading(false);
                        }
                      }}
                      onEditFormChange={(field, value) => setEditForm(prev => ({ ...prev, [field]: value }))}
                      onEditUser={handleEditUser}
                      onDeleteUser={handleDeleteUser}
                      onImportConfirm={handleConfirmImport}
                      onImportModalClose={() => {
                        setShowImportModal(false);
                        resetImportState();
                      }}
                      onImportCategoriesChange={setImportCategories}
                      onImportCatSearchChange={setImportCatSearch}
                      onCatSearchChange={setCatSearch}
                      onBulkCatSetChange={setBulkCatSet}
                      onCatsOptionChange={setCatsOption}
                      onSaveBulkCats={saveBulkUserCats}
                      onSaveUserCats={saveUserCats}
                      onUserCatSetChange={setUserCatSet}
                      showBulkDeleteModal={showBulkDeleteModal}
                      showExportOptionsModal={showExportOptionsModal}
                      bulkDeleteLoading={bulkDeleteLoading}
                      bulkDeleteError={bulkDeleteError}
                      onBulkDeleteModalToggle={handleBulkDeleteModalToggle}
                      onBulkDeleteUsers={handleBulkDeleteUsers}
                      EMPTY_USER_FILTERS={EMPTY_USER_FILTERS}
                    />
                  )}
                </ErrorBoundary>
              )}

              {activeTab === 'courses' && (
                <ErrorBoundary>
                  {coursesLoading ? (
                    <div className="space-y-4">
                      <SkeletonTable rows={8} columns={4} />
                    </div>
                  ) : (
                    <CoursesTab
                      visibleCourses={visibleCourses}
                      coursesLoading={coursesLoading}
                      totalCourses={totalCourses}
                      courseCurrentPage={courseCurrentPage}
                      coursesPerPage={coursesPerPage}
                      coursesPerPageOptions={coursesPerPageOptions}
                      selectedCourseIds={selectedCourseIds}
                      selectedCourseLabel={selectedCourseLabel}
                      searchCourse={searchCourse}
                      courseSearchField={courseSearchField}
                      courseTotalPages={courseTotalPages}
                      teacherOptions={teacherOptions}
                      courseForm={courseForm}
                      courseError={courseError}
                      courseLoading={courseLoading}
                      categories={categories}
                      showCourseCatsModal={showCourseCatsModal}
                      showParticipantsModal={showParticipantsModal}
                      showAddCourseModal={showAddCourseModal}
                      selectedCourse={selectedCourse}
                      participants={participants}
                      participantsLoading={participantsLoading}
                      participantsError={participantsError}
                      courseCatsOption={courseCatsOption}
                      courseCatSearch={courseCatSearch}
                      courseBulkCatSet={courseBulkCatSet}
                      showCourseCatModal={showCourseCatModal}
                      selectedCourseForCat={selectedCourseForCat}
                      courseCatSet={courseCatSet}
                      showBulkDeleteModal={showBulkDeleteCoursesModal}
                      bulkDeleteLoading={bulkDeleteCoursesLoading}
                      bulkDeleteError={bulkDeleteCoursesError}
                      appliedCourseFilters={appliedCourseFilters}
                      courseFilters={courseFilters}
                      showCourseFilterModal={showCourseFilterModal}
                      onSearchChange={setSearchCourse}
                      onSearchFieldChange={setCourseSearchField}
                      onSearchSubmit={handleCourseSearchSubmit}
                      onAddCourseClick={() => { setCourseForm({ title: '', description: '', teacher_id: teacherOptions[0]?.id || '' }); setCourseError(''); setShowAddCourseModal(true); }}
                      onCourseCatsModalOpen={openCourseCatsModal}
                      onSelectAllCoursesToggle={toggleSelectAllCourses}
                      onCourseSelectionToggle={toggleCourseSelection}
                      onCoursesPerPageChange={(value) => { setCoursesPerPage(value); setCourseCurrentPage(1); }}
                      onCoursePageChange={setCourseCurrentPage}
                      onParticipantsModalOpen={(course) => { setSelectedCourse(course); setShowParticipantsModal(true); setParticipantsLoading(true); setParticipantsError(''); fetchParticipants(course.id); }}
                      onCourseFormChange={(field, value) => setCourseForm(prev => ({ ...prev, [field]: value }))}
                      onCourseSubmit={handleCourseSubmit}
                      onAddCourseModalClose={() => { setShowAddCourseModal(false); setCourseError(''); }}
                      onParticipantsModalClose={() => { setShowParticipantsModal(false); setParticipants([]); setSelectedCourse(null); }}
                      onCourseCatsModalClose={() => { setShowCourseCatsModal(false); setCourseBulkCatSet(new Set()); setCourseCatSearch(''); }}
                      onSaveBulkCourseCats={saveBulkCourseCats}
                      onCourseCatsOptionChange={setCourseCatsOption}
                      onCourseCatSearchChange={setCourseCatSearch}
                      onCourseBulkCatSetChange={setCourseBulkCatSet}
                      onCourseCatModalToggle={(course) => {
                        if (course) {
                          openCourseCatModal(course);
                        } else {
                          setShowCourseCatModal(false);
                          setSelectedCourseForCat(null);
                          setCourseCatSet(new Set());
                        }
                      }}
                      onCourseCatSetChange={setCourseCatSet}
                      onSaveCourseCats={saveCourseCats}
                      onBulkDeleteModalToggle={() => setShowBulkDeleteCoursesModal(!showBulkDeleteCoursesModal)}
                      onBulkDeleteCourses={handleBulkDeleteCourses}
                      onCourseFiltersChange={setCourseFilters}
                      onAppliedCourseFiltersChange={setAppliedCourseFilters}
                      onCourseFilterModalToggle={() => setShowCourseFilterModal(!showCourseFilterModal)}
                      EMPTY_COURSE_FILTERS={EMPTY_COURSE_FILTERS}
                    />
                  )}
                </ErrorBoundary>
              )}

              {activeTab === 'categories' && (
                <ErrorBoundary>
                  <CategoriesTab
                    categories={categories}
                    catLoading={catLoading}
                    catForm={catForm}
                    catError={catError}
                    onCatFormChange={(field, value) => setCatForm(prev => ({ ...prev, [field]: value }))}
                    onSaveCategory={handleSaveCategory}
                    onEditCategory={(category) => setCatForm({ id: category.id, name: category.name, description: category.description || '' })}
                    onDeleteCategory={handleDeleteCategory}
                  />
                </ErrorBoundary>
              )}
            </ErrorBoundary>
          )}
        </section>
        </div>
      </main>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`rounded-lg px-4 py-3 shadow-lg transition-all duration-300 ${
            toastType === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-lg ${toastType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {toastType === 'success' ? '✓' : '✕'}
              </span>
              <p className="text-sm font-medium">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Export Options Modal */}
      {showExportOptionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Pilih Opsi Export</h3>
              <p className="text-sm text-slate-600">Pilih data yang ingin diekspor</p>
            </div>

            <div className="space-y-4">
              {/* Export Options */}
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="exportOption"
                    value="current"
                    checked={exportOption === 'current'}
                    onChange={(e) => setExportOption(e.target.value as 'current')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Data yang sedang ditampilkan</span>
                    <p className="text-xs text-slate-500">Export data pada halaman saat ini ({users.length} user)</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="exportOption"
                    value="filtered"
                    checked={exportOption === 'filtered'}
                    onChange={(e) => setExportOption(e.target.value as 'filtered')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Data yang difilter</span>
                    <p className="text-xs text-slate-500">Export semua data yang sesuai dengan filter aktif</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="exportOption"
                    value="custom"
                    checked={exportOption === 'custom'}
                    onChange={(e) => setExportOption(e.target.value as 'custom')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Filter kustom</span>
                    <p className="text-xs text-slate-500">Tentukan filter khusus untuk export</p>
                  </div>
                </label>
              </div>

              {/* Custom Filters Section */}
              {exportOption === 'custom' && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Pencarian</label>
                    <div className="flex space-x-2">
                      <select
                        value={exportSearchField}
                        onChange={(e) => setExportSearchField(e.target.value as UserSearchField)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="all">Semua</option>
                        <option value="name">Nama</option>
                        <option value="email">Email</option>
                        <option value="provinsi">Provinsi</option>
                        <option value="category">Kategori</option>
                      </select>
                      <input
                        type="text"
                        value={exportSearch}
                        onChange={(e) => setExportSearch(e.target.value)}
                        placeholder="Kata kunci..."
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Filter Role</label>
                    <div className="flex flex-wrap gap-2">
                      {['admin', 'teacher', 'student'].map((role) => (
                        <label key={role} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={exportFilters.roles.includes(role)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setExportFilters(prev => ({ ...prev, roles: [...prev.roles, role] }));
                              } else {
                                setExportFilters(prev => ({ ...prev, roles: prev.roles.filter(r => r !== role) }));
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-600 capitalize">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Filter Provinsi</label>
                    <input
                      type="text"
                      value={exportFilters.provinces.join(', ')}
                      onChange={(e) => setExportFilters(prev => ({ ...prev, provinces: e.target.value.split(',').map(p => p.trim()).filter(p => p) }))}
                      placeholder="Provinsi1, Provinsi2, ..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Filter Kategori</label>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {categories.map((category) => (
                        <label key={category.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={exportFilters.categories.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setExportFilters(prev => ({ ...prev, categories: [...prev.categories, category.id] }));
                              } else {
                                setExportFilters(prev => ({ ...prev, categories: prev.categories.filter(c => c !== category.id) }));
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-600">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowExportOptionsModal(false)}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Batal
              </button>
              <button
                onClick={handleExportWithOptions}
                disabled={exportLoading}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportLoading ? 'Mengexport...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  );
}
