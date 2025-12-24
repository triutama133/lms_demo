import { PrismaClient } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Interface untuk abstraksi database
interface DatabaseService {
  user: {
    findFirst: (args: Record<string, unknown>) => Promise<unknown>;
    findUnique: (args: Record<string, unknown>) => Promise<unknown>;
    findMany: (args: Record<string, unknown>) => Promise<unknown>;
    create: (args: Record<string, unknown>) => Promise<unknown>;
    update: (args: Record<string, unknown>) => Promise<unknown>;
    count: (args: Record<string, unknown>) => Promise<number>;
    delete: (args: Record<string, unknown>) => Promise<unknown>;
    deleteMany: (args: Record<string, unknown>) => Promise<unknown>;
  };
  course: {
    findFirst: (args: Record<string, unknown>) => Promise<unknown>;
    findUnique: (args: Record<string, unknown>) => Promise<unknown>;
    findMany: (args: Record<string, unknown>) => Promise<unknown>;
    create: (args: Record<string, unknown>) => Promise<unknown>;
    update: (args: Record<string, unknown>) => Promise<unknown>;
    updateMany: (args: Record<string, unknown>) => Promise<unknown>;
    delete: (args: Record<string, unknown>) => Promise<unknown>;
    deleteMany: (args: Record<string, unknown>) => Promise<unknown>;
    count: (args: Record<string, unknown>) => Promise<number>;
  };
  enrollment: {
    findFirst: (args: Record<string, unknown>) => Promise<unknown>;
    findMany: (args: Record<string, unknown>) => Promise<unknown>;
    create: (args: Record<string, unknown>) => Promise<unknown>;
    createMany: (args: Record<string, unknown>) => Promise<unknown>;
    count: (args: Record<string, unknown>) => Promise<number>;
    groupBy: (args: Record<string, unknown>) => Promise<unknown>;
  };
  material: {
    findFirst: (args: Record<string, unknown>) => Promise<unknown>;
    findUnique: (args: Record<string, unknown>) => Promise<unknown>;
    findMany: (args: Record<string, unknown>) => Promise<unknown>;
    create: (args: Record<string, unknown>) => Promise<unknown>;
    update: (args: Record<string, unknown>) => Promise<unknown>;
    delete: (args: Record<string, unknown>) => Promise<unknown>;
  };
  progress: {
    findFirst: (args: Record<string, unknown>) => Promise<unknown>;
    findMany: (args: Record<string, unknown>) => Promise<unknown>;
    create: (args: Record<string, unknown>) => Promise<unknown>;
    update: (args: Record<string, unknown>) => Promise<unknown>;
    upsert: (args: Record<string, unknown>) => Promise<unknown>;
  };
  category: {
    findFirst: (args: Record<string, unknown>) => Promise<unknown>;
    findUnique: (args: Record<string, unknown>) => Promise<unknown>;
    findMany: (args: Record<string, unknown>) => Promise<unknown>;
    create: (args: Record<string, unknown>) => Promise<unknown>;
    update: (args: Record<string, unknown>) => Promise<unknown>;
    delete: (args: Record<string, unknown>) => Promise<unknown>;
  };
  userCategory: {
    findMany: (args: Record<string, unknown>) => Promise<unknown>;
    create: (args: Record<string, unknown>) => Promise<unknown>;
  };
  courseRating: {
    findFirst: (args: Record<string, unknown>) => Promise<unknown>;
    findMany: (args: Record<string, unknown>) => Promise<unknown>;
    create: (args: Record<string, unknown>) => Promise<unknown>;
    update: (args: Record<string, unknown>) => Promise<unknown>;
  };
  materialSection: {
    findFirst: (args: Record<string, unknown>) => Promise<unknown>;
    findMany: (args: Record<string, unknown>) => Promise<unknown>;
    create: (args: Record<string, unknown>) => Promise<unknown>;
    createMany: (args: Record<string, unknown>) => Promise<unknown>;
    update: (args: Record<string, unknown>) => Promise<unknown>;
    delete: (args: Record<string, unknown>) => Promise<unknown>;
    deleteMany: (args: Record<string, unknown>) => Promise<unknown>;
  };
}

// Implementasi Prisma
class PrismaService implements DatabaseService {
  private prisma: PrismaClient | null = null;

  private getPrisma(): PrismaClient {
    if (!this.prisma) {
      this.prisma = new PrismaClient();
    }
    return this.prisma;
  }

  user = {
    findFirst: (args: Record<string, unknown>) => this.getPrisma().user.findFirst(args as any),
    findUnique: (args: Record<string, unknown>) => this.getPrisma().user.findUnique(args as any),
    findMany: (args: Record<string, unknown>) => this.getPrisma().user.findMany(args as any),
    create: (args: Record<string, unknown>) => this.getPrisma().user.create(args as any),
    update: (args: Record<string, unknown>) => this.getPrisma().user.update(args as any),
    count: (args: Record<string, unknown>) => this.getPrisma().user.count(args as any),
    delete: (args: Record<string, unknown>) => this.getPrisma().user.delete(args as any),
    deleteMany: (args: Record<string, unknown>) => this.getPrisma().user.deleteMany(args as any),
  };
  course = {
    findFirst: (args: Record<string, unknown>) => this.getPrisma().course.findFirst(args as any),
    findUnique: (args: Record<string, unknown>) => this.getPrisma().course.findUnique(args as any),
    findMany: (args: Record<string, unknown>) => this.getPrisma().course.findMany(args as any),
    create: (args: Record<string, unknown>) => this.getPrisma().course.create(args as any),
    update: (args: Record<string, unknown>) => this.getPrisma().course.update(args as any),
    updateMany: (args: Record<string, unknown>) => this.getPrisma().course.updateMany(args as any),
    delete: (args: Record<string, unknown>) => this.getPrisma().course.delete(args as any),
    deleteMany: (args: Record<string, unknown>) => this.getPrisma().course.deleteMany(args as any),
    count: (args: Record<string, unknown>) => this.getPrisma().course.count(args as any),
  };
  enrollment = {
    findFirst: (args: Record<string, unknown>) => this.getPrisma().enrollment.findFirst(args as any),
    findMany: (args: Record<string, unknown>) => this.getPrisma().enrollment.findMany(args as any),
    create: (args: Record<string, unknown>) => this.getPrisma().enrollment.create(args as any),
    createMany: (args: Record<string, unknown>) => this.getPrisma().enrollment.createMany(args as any),
    count: (args: Record<string, unknown>) => this.getPrisma().enrollment.count(args as any),
    groupBy: (args: Record<string, unknown>) => this.getPrisma().enrollment.groupBy(args as any),
  };
  material = {
    findFirst: (args: Record<string, unknown>) => this.getPrisma().material.findFirst(args as any),
    findUnique: (args: Record<string, unknown>) => this.getPrisma().material.findUnique(args as any),
    findMany: (args: Record<string, unknown>) => this.getPrisma().material.findMany(args as any),
    create: (args: Record<string, unknown>) => this.getPrisma().material.create(args as any),
    update: (args: Record<string, unknown>) => this.getPrisma().material.update(args as any),
    delete: (args: Record<string, unknown>) => this.getPrisma().material.delete(args as any),
  };
  progress = {
    findFirst: (args: Record<string, unknown>) => this.getPrisma().progress.findFirst(args as any),
    findMany: (args: Record<string, unknown>) => this.getPrisma().progress.findMany(args as any),
    create: (args: Record<string, unknown>) => this.getPrisma().progress.create(args as any),
    update: (args: Record<string, unknown>) => this.getPrisma().progress.update(args as any),
    upsert: (args: Record<string, unknown>) => this.getPrisma().progress.upsert(args as any),
  };
  category = {
    findFirst: (args: Record<string, unknown>) => this.getPrisma().category.findFirst(args as any),
    findUnique: (args: Record<string, unknown>) => this.getPrisma().category.findUnique(args as any),
    findMany: (args: Record<string, unknown>) => this.getPrisma().category.findMany(args as any),
    create: (args: Record<string, unknown>) => this.getPrisma().category.create(args as any),
    update: (args: Record<string, unknown>) => this.getPrisma().category.update(args as any),
    delete: (args: Record<string, unknown>) => this.getPrisma().category.delete(args as any),
  };
  userCategory = {
    findMany: (args: Record<string, unknown>) => this.getPrisma().userCategory.findMany(args as any),
    create: (args: Record<string, unknown>) => this.getPrisma().userCategory.create(args as any),
  };
  courseRating = {
    findFirst: (args: Record<string, unknown>) => this.getPrisma().courseRating.findFirst(args as any),
    findMany: (args: Record<string, unknown>) => this.getPrisma().courseRating.findMany(args as any),
    create: (args: Record<string, unknown>) => this.getPrisma().courseRating.create(args as any),
    update: (args: Record<string, unknown>) => this.getPrisma().courseRating.update(args as any),
  };
  materialSection = {
    findFirst: (args: Record<string, unknown>) => this.getPrisma().materialSection.findFirst(args as any),
    findMany: (args: Record<string, unknown>) => this.getPrisma().materialSection.findMany(args as any),
    create: (args: Record<string, unknown>) => this.getPrisma().materialSection.create(args as any),
    createMany: (args: Record<string, unknown>) => this.getPrisma().materialSection.createMany(args as any),
    update: (args: Record<string, unknown>) => this.getPrisma().materialSection.update(args as any),
    delete: (args: Record<string, unknown>) => this.getPrisma().materialSection.delete(args as any),
    deleteMany: (args: Record<string, unknown>) => this.getPrisma().materialSection.deleteMany(args as any),
  };
}

// Helper function to convert camelCase to snake_case
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertObjectKeysToCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(convertObjectKeysToCamelCase);
  }

  const converted: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = snakeToCamel(key);
      converted[camelKey] = convertObjectKeysToCamelCase(obj[key]);
    }
  }
  return converted;
}

function convertObjectKeysToSnakeCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(convertObjectKeysToSnakeCase);
  }

  const converted: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = camelToSnake(key);
      converted[snakeKey] = convertObjectKeysToSnakeCase(obj[key]);
    }
  }
  return converted;
}

// Helper to apply where conditions to Supabase query
function applyWhereConditions(query: any, where: any): void {
  if (!where) return;

  Object.keys(where).forEach(key => {
    const value = where[key];
    const snakeKey = camelToSnake(key);

    if (key === 'OR') {
      // Handle OR conditions
      if (Array.isArray(value)) {
        const orConditions = value.map((condition: any) => {
          const filters: any = {};
          Object.keys(condition).forEach(condKey => {
            const condValue = condition[condKey];
            const snakeCondKey = camelToSnake(condKey);
            
            if (typeof condValue === 'object' && condValue !== null) {
              // Handle nested conditions like { contains: 'value', mode: 'insensitive' }
              if (condValue.contains !== undefined) {
                filters[snakeCondKey] = condValue.contains;
              } else if (condValue.in !== undefined) {
                filters[snakeCondKey] = condValue.in;
              }
            } else {
              filters[snakeCondKey] = condValue;
            }
          });
          return filters;
        });
        
        if (orConditions.length > 0) {
          query.or(orConditions.map((cond: any) => 
            Object.entries(cond).map(([k, v]) => `${k}.eq.${v}`).join(',')
          ).join(','));
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      // Handle nested conditions
      if (value.contains !== undefined) {
        query.ilike(snakeKey, `%${value.contains}%`);
      } else if (value.in !== undefined) {
        query.in(snakeKey, value.in);
      } else if (value.hasSome !== undefined) {
        // Handle array contains
        query.contains(snakeKey, value.hasSome);
      } else {
        // Simple equality
        query.eq(snakeKey, value);
      }
    } else {
      // Simple equality
      query.eq(snakeKey, value);
    }
  });
}
function convertSelectToString(select: any): string {
  if (!select || typeof select !== 'object') return '*';
  // Filter out nested selects (objects) and only keep boolean true fields
  const fields = Object.keys(select).filter(key => {
    const value = select[key];
    return value === true && typeof value !== 'object';
  });

  // Convert camelCase to snake_case for database column names
  const snakeCaseFields = fields.map(field => camelToSnake(field));

  return snakeCaseFields.length > 0 ? snakeCaseFields.join(',') : '*';
}

// Implementasi Supabase
class SupabaseService implements DatabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  user = {
    findFirst: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('users').select(selectStr);
      if (args.where) {
        Object.keys(args.where).forEach(key => {
          const snakeKey = camelToSnake(key);
          query.eq(snakeKey, args.where[key]);
        });
      }
      const { data, error } = await query.limit(1).single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return convertObjectKeysToCamelCase(data);
    },
    findUnique: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('users').select(selectStr);
      if (args.where) {
        Object.keys(args.where).forEach(key => {
          const snakeKey = camelToSnake(key);
          query.eq(snakeKey, args.where[key]);
        });
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data ? convertObjectKeysToCamelCase(data) : null;
    },
    findMany: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('users').select(selectStr);
      applyWhereConditions(query, args.where);
      if (args.take) {
        query.limit(args.take);
      }
      if (args.skip) {
        query.range(args.skip, args.skip + (args.take || 10) - 1);
      }
      const { data, error } = await query;
      if (error) throw error;
      return convertObjectKeysToCamelCase(data);
    },
    create: async (args: any) => {
      const convertedData = convertObjectKeysToSnakeCase(args.data);
      const { error } = await this.supabase.from('users').insert(convertedData);
      if (error) throw error;
      return { success: true };
    },
    update: async (args: any) => {
      const convertedData = convertObjectKeysToSnakeCase(args.data);
      const query = this.supabase.from('users').update(convertedData);
      applyWhereConditions(query, args.where);
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data;
    },
    count: async (args: any) => {
      const query = this.supabase.from('users').select('*', { count: 'exact', head: true });
      if (args.where) {
        Object.keys(args.where).forEach(key => {
          const snakeKey = camelToSnake(key);
          query.eq(snakeKey, args.where[key]);
        });
      }
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    delete: async (args: any) => {
      const query = this.supabase.from('users').delete();
      if (args.where) {
        Object.keys(args.where).forEach(key => {
          const snakeKey = camelToSnake(key);
          query.eq(snakeKey, args.where[key]);
        });
      }
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data;
    },
    deleteMany: async (args: any) => {
      const query = this.supabase.from('users').delete();
      applyWhereConditions(query, args.where);
      const { data, error } = await query.select();
      if (error) throw error;
      return data;
    },
  };

  course = {
    findFirst: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('courses').select(selectStr);
      applyWhereConditions(query, args.where);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return convertObjectKeysToCamelCase(data);
    },
    findUnique: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('courses').select(selectStr);
      applyWhereConditions(query, args.where);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return convertObjectKeysToCamelCase(data);
    },
    findMany: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('courses').select(selectStr);
      applyWhereConditions(query, args.where);
      if (args.take) {
        query.limit(args.take);
      }
      if (args.skip) {
        query.range(args.skip, args.skip + (args.take || 10) - 1);
      }
      const { data, error } = await query;
      if (error) throw error;
      return convertObjectKeysToCamelCase(data);
    },
    create: async (args: any) => {
      const convertedData = convertObjectKeysToSnakeCase(args.data);
      const { data, error } = await this.supabase.from('courses').insert(convertedData).select().single();
      if (error) throw error;
      return data;
    },
    update: async (args: any) => {
      const convertedData = convertObjectKeysToSnakeCase(args.data);
      const query = this.supabase.from('courses').update(convertedData);
      applyWhereConditions(query, args.where);
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data;
    },
    updateMany: async (args: any) => {
      const convertedData = convertObjectKeysToSnakeCase(args.data);
      const query = this.supabase.from('courses').update(convertedData);
      applyWhereConditions(query, args.where);
      const { data, error } = await query.select();
      if (error) throw error;
      return data;
    },
    delete: async (args: any) => {
      const query = this.supabase.from('courses').delete();
      if (args.where) {
        Object.keys(args.where).forEach(key => {
          const snakeKey = camelToSnake(key);
          query.eq(snakeKey, args.where[key]);
        });
      }
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data;
    },
    deleteMany: async (args: any) => {
      const query = this.supabase.from('courses').delete();
      applyWhereConditions(query, args.where);
      const { data, error } = await query.select();
      if (error) throw error;
      return data;
    },
    count: async (args: any) => {
      const query = this.supabase.from('courses').select('*', { count: 'exact', head: true });
      if (args.where) {
        Object.keys(args.where).forEach(key => {
          const snakeKey = camelToSnake(key);
          query.eq(snakeKey, args.where[key]);
        });
      }
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  };

  enrollment = {
    findFirst: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('enrollments').select(selectStr);
      if (args.where) {
        Object.keys(args.where).forEach(key => {
          const snakeKey = camelToSnake(key);
          query.eq(snakeKey, args.where[key]);
        });
      }
      const { data, error } = await query.limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return convertObjectKeysToCamelCase(data);
    },
    findMany: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('enrollments').select(selectStr);
      applyWhereConditions(query, args.where);
      if (args.take) {
        query.limit(args.take);
      }
      if (args.skip) {
        query.range(args.skip, args.skip + (args.take || 10) - 1);
      }
      const { data, error } = await query;
      if (error) throw error;
      return convertObjectKeysToCamelCase(data);
    },
    create: async (args: any) => {
      const convertedData = convertObjectKeysToSnakeCase(args.data);
      const { data, error } = await this.supabase.from('enrollments').insert(convertedData).select().single();
      if (error) throw error;
      return data;
    },
    createMany: async (args: any) => {
      const { data, error } = await this.supabase.from('enrollments').insert(args.data).select();
      if (error) throw error;
      return data;
    },
    count: async (args: any) => {
      const query = this.supabase.from('enrollments').select('*', { count: 'exact', head: true });
      if (args.where) {
        Object.keys(args.where).forEach(key => {
          const snakeKey = camelToSnake(key);
          query.eq(snakeKey, args.where[key]);
        });
      }
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    groupBy: async (args: any) => {
      // For groupBy with count, we need to implement it manually
      // This is a simplified implementation for the specific use case
      const { data, error } = await this.supabase
        .from('enrollments')
        .select('course_id')
        .in('course_id', args.where?.courseId?.in || []);
      
      if (error) throw error;
      
      // Group and count manually
      const counts: Record<string, number> = {};
      data.forEach((row: any) => {
        counts[row.course_id] = (counts[row.course_id] || 0) + 1;
      });
      
      return Object.entries(counts).map(([courseId, count]) => ({
        courseId,
        _count: { courseId: count }
      }));
    },
  };

  material = {
    findFirst: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('materials').select(selectStr);
      if (args.where) {
        Object.keys(args.where).forEach(key => {
          const snakeKey = camelToSnake(key);
          query.eq(snakeKey, args.where[key]);
        });
      }
      const { data, error } = await query.limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return convertObjectKeysToCamelCase(data);
    },
    findUnique: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('materials').select(selectStr);
      if (args.where) {
        Object.keys(args.where).forEach(key => {
          const snakeKey = camelToSnake(key);
          query.eq(snakeKey, args.where[key]);
        });
      }
      const { data, error } = await query.single();
      if (error) throw error;
      return convertObjectKeysToCamelCase(data);
    },
    findMany: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('materials').select(selectStr);
      applyWhereConditions(query, args.where);
      if (args.take) {
        query.limit(args.take);
      }
      if (args.skip) {
        query.range(args.skip, args.skip + (args.take || 10) - 1);
      }
      const { data, error } = await query;
      if (error) throw error;
      return convertObjectKeysToCamelCase(data);
    },
    create: async (args: any) => {
      const convertedData = convertObjectKeysToSnakeCase(args.data);
      const { data, error } = await this.supabase.from('materials').insert(convertedData).select().single();
      if (error) throw error;
      return data;
    },
    update: async (args: any) => {
      const convertedData = convertObjectKeysToSnakeCase(args.data);
      const query = this.supabase.from('materials').update(convertedData);
      applyWhereConditions(query, args.where);
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data;
    },
    delete: async (args: any) => {
      const query = this.supabase.from('materials').delete();
      applyWhereConditions(query, args.where);
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data;
    },
  };

  progress = {
    findFirst: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('progress').select(selectStr);
      if (args.where) {
        Object.keys(args.where).forEach(key => {
          const snakeKey = camelToSnake(key);
          query.eq(snakeKey, args.where[key]);
        });
      }
      const { data, error } = await query.limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return convertObjectKeysToCamelCase(data);
    },
    findMany: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('progress').select(selectStr);
      applyWhereConditions(query, args.where);
      if (args.take) {
        query.limit(args.take);
      }
      if (args.skip) {
        query.range(args.skip, args.skip + (args.take || 10) - 1);
      }
      const { data, error } = await query;
      if (error) throw error;
      return convertObjectKeysToCamelCase(data);
    },
    create: async (args: any) => {
      const convertedData = convertObjectKeysToSnakeCase(args.data);
      const { data, error } = await this.supabase.from('progress').insert(convertedData).select().single();
      if (error) throw error;
      return data;
    },
    update: async (args: any) => {
      const convertedData = convertObjectKeysToSnakeCase(args.data);
      const query = this.supabase.from('progress').update(convertedData);
      applyWhereConditions(query, args.where);
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data;
    },
    upsert: async (args: any) => {
      // For Supabase, upsert is similar to insert with onConflict resolution
      // We'll use the compound key logic from the where clause
      const { data, error } = await this.supabase.from('progress').upsert(args.data, {
        onConflict: 'user_id,course_id,material_id'
      }).select().single();
      if (error) throw error;
      return data;
    },
  };

  category = {
    findFirst: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('categories').select(selectStr);
      if (args.where) {
        Object.keys(args.where).forEach(key => {
          const snakeKey = camelToSnake(key);
          query.eq(snakeKey, args.where[key]);
        });
      }
      const { data, error } = await query.limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return convertObjectKeysToCamelCase(data);
    },
    findUnique: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('categories').select(selectStr);
      if (args.where) {
        Object.keys(args.where).forEach(key => {
          const snakeKey = camelToSnake(key);
          query.eq(snakeKey, args.where[key]);
        });
      }
      const { data, error } = await query.single();
      if (error) throw error;
      return convertObjectKeysToCamelCase(data);
    },
    findMany: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('categories').select(selectStr);
      applyWhereConditions(query, args.where);
      if (args.take) {
        query.limit(args.take);
      }
      if (args.skip) {
        query.range(args.skip, args.skip + (args.take || 10) - 1);
      }
      const { data, error } = await query;
      if (error) throw error;
      return convertObjectKeysToCamelCase(data);
    },
    create: async (args: any) => {
      const convertedData = convertObjectKeysToSnakeCase(args.data);
      const { data, error } = await this.supabase.from('categories').insert(convertedData).select().single();
      if (error) throw error;
      return data;
    },
    update: async (args: any) => {
      const convertedData = convertObjectKeysToSnakeCase(args.data);
      const query = this.supabase.from('categories').update(convertedData);
      applyWhereConditions(query, args.where);
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data;
    },
    delete: async (args: any) => {
      const query = this.supabase.from('categories').delete();
      applyWhereConditions(query, args.where);
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data;
    },
  };

  userCategory = {
    findMany: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('user_categories').select(selectStr);
      applyWhereConditions(query, args.where);
      if (args.take) {
        query.limit(args.take);
      }
      if (args.skip) {
        query.range(args.skip, args.skip + (args.take || 10) - 1);
      }
      const { data, error } = await query;
      if (error) throw error;
      return convertObjectKeysToCamelCase(data);
    },
    create: async (args: any) => {
      const convertedData = convertObjectKeysToSnakeCase(args.data);
      const { data, error } = await this.supabase.from('user_categories').insert(convertedData).select().single();
      if (error) throw error;
      return data;
    },
  };

  courseRating = {
    findFirst: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('course_ratings').select(selectStr);
      if (args.where) {
        Object.keys(args.where).forEach(key => {
          const snakeKey = camelToSnake(key);
          query.eq(snakeKey, args.where[key]);
        });
      }
      const { data, error } = await query.limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return convertObjectKeysToCamelCase(data);
    },
    findMany: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('course_ratings').select(selectStr);
      applyWhereConditions(query, args.where);
      if (args.take) {
        query.limit(args.take);
      }
      if (args.skip) {
        query.range(args.skip, args.skip + (args.take || 10) - 1);
      }
      const { data, error } = await query;
      if (error) throw error;
      return convertObjectKeysToCamelCase(data);
    },
    create: async (args: any) => {
      const convertedData = convertObjectKeysToSnakeCase(args.data);
      const { data, error } = await this.supabase.from('course_ratings').insert(convertedData).select().single();
      if (error) throw error;
      return data;
    },
    update: async (args: any) => {
      const convertedData = convertObjectKeysToSnakeCase(args.data);
      const query = this.supabase.from('course_ratings').update(convertedData);
      applyWhereConditions(query, args.where);
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data;
    },
  };
  materialSection = {
    findFirst: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('material_sections').select(selectStr);
      if (args.where) {
        Object.keys(args.where).forEach(key => {
          const snakeKey = camelToSnake(key);
          query.eq(snakeKey, args.where[key]);
        });
      }
      const { data, error } = await query.limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return convertObjectKeysToCamelCase(data);
    },
    findMany: async (args: any) => {
      const selectStr = convertSelectToString(args.select);
      const query = this.supabase.from('material_sections').select(selectStr);
      applyWhereConditions(query, args.where);
      if (args.orderBy) {
        // Handle orderBy
        if (Array.isArray(args.orderBy)) {
          args.orderBy.forEach((order: any) => {
            Object.keys(order).forEach(key => {
              query.order(key, { ascending: order[key] === 'asc' });
            });
          });
        }
      }
      if (args.take) {
        query.limit(args.take);
      }
      if (args.skip) {
        query.range(args.skip, args.skip + (args.take || 10) - 1);
      }
      const { data, error } = await query;
      if (error) throw error;
      return convertObjectKeysToCamelCase(data);
    },
    create: async (args: any) => {
      const convertedData = convertObjectKeysToSnakeCase(args.data);
      const { data, error } = await this.supabase.from('material_sections').insert(convertedData).select().single();
      if (error) throw error;
      return data;
    },
    createMany: async (args: any) => {
      const convertedData = Array.isArray(args.data) ? args.data.map(convertObjectKeysToSnakeCase) : convertObjectKeysToSnakeCase(args.data);
      const { data, error } = await this.supabase.from('material_sections').insert(convertedData);
      if (error) throw error;
      return data;
    },
    update: async (args: any) => {
      const convertedData = convertObjectKeysToSnakeCase(args.data);
      const query = this.supabase.from('material_sections').update(convertedData);
      applyWhereConditions(query, args.where);
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data;
    },
    delete: async (args: any) => {
      const query = this.supabase.from('material_sections').delete();
      applyWhereConditions(query, args.where);
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data;
    },
    deleteMany: async (args: any) => {
      const query = this.supabase.from('material_sections').delete();
      applyWhereConditions(query, args.where);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  };
}

// Factory function
export function createDatabaseService(): DatabaseService {
  const type = process.env.DATABASE_TYPE || 'prisma';
  if (type === 'supabase') {
    return new SupabaseService();
  }
  return new PrismaService();
}

export const dbService = createDatabaseService();