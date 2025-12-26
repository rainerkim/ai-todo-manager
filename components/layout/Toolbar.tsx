/**
 * 툴바 컴포넌트
 * 검색, 필터, 정렬 기능을 제공한다
 */

'use client';

import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Priority, Category } from '@/types/todo';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPriorities: Priority[];
  onPriorityChange: (priorities: Priority[]) => void;
  selectedCategories: Category[];
  onCategoryChange: (categories: Category[]) => void;
  showCompleted: boolean;
  onShowCompletedChange: (show: boolean) => void;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
}

export const Toolbar = ({
  searchQuery,
  onSearchChange,
  selectedPriorities,
  onPriorityChange,
  selectedCategories,
  onCategoryChange,
  showCompleted,
  onShowCompletedChange,
  sortBy,
  onSortChange,
}: ToolbarProps) => {
  /**
   * 우선순위 필터 토글
   */
  const togglePriority = (priority: Priority) => {
    if (selectedPriorities.includes(priority)) {
      onPriorityChange(selectedPriorities.filter((p) => p !== priority));
    } else {
      onPriorityChange([...selectedPriorities, priority]);
    }
  };

  /**
   * 카테고리 필터 토글
   */
  const toggleCategory = (category: Category) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  /**
   * 활성화된 필터 개수
   */
  const activeFiltersCount =
    selectedPriorities.length +
    selectedCategories.length +
    (showCompleted ? 0 : 1);

  return (
    <div className="sticky top-16 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* 검색 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="할 일 검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 필터 및 정렬 */}
          <div className="flex items-center gap-2">
            {/* 필터 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  <span>필터</span>
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>우선순위</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={selectedPriorities.includes('high')}
                  onCheckedChange={() => togglePriority('high')}
                >
                  높음
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedPriorities.includes('medium')}
                  onCheckedChange={() => togglePriority('medium')}
                >
                  중간
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedPriorities.includes('low')}
                  onCheckedChange={() => togglePriority('low')}
                >
                  낮음
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>카테고리</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={selectedCategories.includes('업무')}
                  onCheckedChange={() => toggleCategory('업무')}
                >
                  업무
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedCategories.includes('개인')}
                  onCheckedChange={() => toggleCategory('개인')}
                >
                  개인
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedCategories.includes('학습')}
                  onCheckedChange={() => toggleCategory('학습')}
                >
                  학습
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>상태</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={showCompleted}
                  onCheckedChange={onShowCompletedChange}
                >
                  완료된 할 일 표시
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 정렬 */}
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-[140px] sm:w-[180px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">우선순위 순</SelectItem>
                <SelectItem value="dueDate">마감일 순</SelectItem>
                <SelectItem value="createDate">생성일 순</SelectItem>
                <SelectItem value="title">제목 순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

