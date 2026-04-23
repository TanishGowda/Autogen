import type { Project, AnalysisResult } from "../types";

export const mockProjects: Project[] = [
  {
    id: "1",
    user_id: "user-1",
    name: "E-Commerce Platform",
    description: "An online shopping platform with user accounts, product catalog, cart and checkout",
    mode: "user-story",
    created_at: "2026-02-20T10:30:00Z",
    updated_at: "2026-02-20T10:35:00Z",
    status: "completed",
  },
  {
    id: "2",
    user_id: "user-1",
    name: "Sorting Algorithms",
    description: "QuickSort and MergeSort implementations with helper utilities",
    mode: "code-upload",
    language: "Python",
    created_at: "2026-02-19T14:00:00Z",
    updated_at: "2026-02-19T14:10:00Z",
    status: "completed",
    file_count: 3,
  },
  {
    id: "3",
    user_id: "user-1",
    name: "Student Portal",
    description: "University student management system with enrollment, grading and notifications",
    mode: "user-story",
    created_at: "2026-02-18T09:00:00Z",
    updated_at: "2026-02-18T09:00:00Z",
    status: "processing",
  },
  {
    id: "4",
    user_id: "user-1",
    name: "Graph Traversal",
    description: "BFS and DFS implementations with adjacency list representation",
    mode: "code-upload",
    language: "Java",
    created_at: "2026-02-17T11:00:00Z",
    updated_at: "2026-02-17T11:05:00Z",
    status: "completed",
    file_count: 2,
  },
];

export const mockStoryResult: AnalysisResult = {
  id: "result-1",
  project_id: "1",
  mode: "user-story",
  architecture_diagram: `@startuml
package "Presentation Layer" {
  [Web Frontend (React)]
  [Mobile App]
}

package "API Gateway" {
  [REST API Gateway]
  [Authentication Middleware]
}

package "Business Layer" {
  [User Service]
  [Product Service]
  [Order Service]
  [Payment Service]
  [Notification Service]
}

package "Data Layer" {
  database "User DB" as UDB
  database "Product DB" as PDB
  database "Order DB" as ODB
}

[Web Frontend (React)] --> [REST API Gateway]
[Mobile App] --> [REST API Gateway]
[REST API Gateway] --> [Authentication Middleware]
[Authentication Middleware] --> [User Service]
[REST API Gateway] --> [Product Service]
[REST API Gateway] --> [Order Service]
[REST API Gateway] --> [Payment Service]
[Order Service] --> [Notification Service]
[User Service] --> UDB
[Product Service] --> PDB
[Order Service] --> ODB
@enduml`,
  usecase_diagram: `@startuml
left to right direction
actor Customer
actor Admin
actor "Payment Gateway" as PG

rectangle "E-Commerce Platform" {
  usecase "Register / Login" as UC1
  usecase "Browse Products" as UC2
  usecase "Search Products" as UC3
  usecase "Add to Cart" as UC4
  usecase "Place Order" as UC5
  usecase "Make Payment" as UC6
  usecase "Track Order" as UC7
  usecase "Manage Products" as UC8
  usecase "View Reports" as UC9
  usecase "Manage Users" as UC10
}

Customer --> UC1
Customer --> UC2
Customer --> UC3
Customer --> UC4
Customer --> UC5
Customer --> UC7
UC5 ..> UC6 : <<include>>
UC6 --> PG
Admin --> UC8
Admin --> UC9
Admin --> UC10
@enduml`,
  whitebox_tests: [],
  blackbox_tests: [],
  summary:
    "The E-Commerce Platform is a multi-layered web application supporting two primary user roles: Customer and Admin. Customers can register, browse and search products, manage their shopping cart, place orders, make payments through an external payment gateway, and track order status. Admins have access to product management, user management, and reporting dashboards. The system follows a microservice-oriented architecture with separate services for users, products, orders, payments, and notifications. The data layer uses separate databases per domain for scalability. An API gateway with authentication middleware handles all incoming requests.",
  created_at: "2026-02-20T10:35:00Z",
};

export const mockCodeResult: AnalysisResult = {
  id: "result-2",
  project_id: "2",
  mode: "code-upload",
  controlflow_diagram: `@startuml
title QuickSort Control Flow

start
:quickSort(arr, low, high);

if (low < high?) then (yes)
  :pi = partition(arr, low, high);
  :quickSort(arr, low, pi - 1);
  :quickSort(arr, pi + 1, high);
else (no)
  :return;
endif

stop

partition "partition(arr, low, high)" {
  start
  :pivot = arr[high];
  :i = low - 1;
  
  while (j from low to high - 1) is (iterate)
    if (arr[j] <= pivot?) then (yes)
      :i++;
      :swap arr[i] and arr[j];
    else (no)
    endif
  endwhile (done)
  
  :swap arr[i+1] and arr[high];
  :return i + 1;
  stop
}
@enduml`,
  class_diagram: `@startuml
class SortUtils {
  +swap(arr: int[], i: int, j: int): void
  +isSorted(arr: int[]): boolean
  +printArray(arr: int[]): void
}

class QuickSort {
  -comparisons: int
  +sort(arr: int[]): int[]
  -quickSort(arr: int[], low: int, high: int): void
  -partition(arr: int[], low: int, high: int): int
  +getComparisons(): int
}

class MergeSort {
  -comparisons: int
  +sort(arr: int[]): int[]
  -mergeSort(arr: int[], left: int, right: int): void
  -merge(arr: int[], left: int, mid: int, right: int): void
  +getComparisons(): int
}

interface Sortable {
  +sort(arr: int[]): int[]
}

Sortable <|.. QuickSort
Sortable <|.. MergeSort
QuickSort --> SortUtils : uses
MergeSort --> SortUtils : uses
@enduml`,
  whitebox_tests: [
    {
      id: "wt-1",
      name: "QuickSort - Partition Pivot Placement",
      description:
        "Verifies the partition function places the pivot in the correct position and elements are properly divided",
      type: "whitebox",
      input: "arr = [10, 7, 8, 9, 1, 5], low = 0, high = 5",
      expected_output: "Pivot (5) placed at index 1, elements left of pivot < 5, elements right > 5",
      code: `def test_partition_pivot_placement():
    arr = [10, 7, 8, 9, 1, 5]
    qs = QuickSort()
    pi = qs.partition(arr, 0, 5)
    
    assert arr[pi] == 5
    assert all(arr[i] <= 5 for i in range(pi))
    assert all(arr[i] > 5 for i in range(pi + 1, len(arr)))`,
    },
    {
      id: "wt-2",
      name: "MergeSort - Merge Two Halves",
      description:
        "Tests the merge step correctly combines two sorted subarrays into a single sorted array",
      type: "whitebox",
      input: "arr = [3, 8, 12, 1, 5, 9], left = 0, mid = 2, right = 5",
      expected_output: "arr = [1, 3, 5, 8, 9, 12]",
      code: `def test_merge_two_sorted_halves():
    arr = [3, 8, 12, 1, 5, 9]
    ms = MergeSort()
    ms.merge(arr, 0, 2, 5)
    
    assert arr == [1, 3, 5, 8, 9, 12]`,
    },
    {
      id: "wt-3",
      name: "QuickSort - Recursive Depth on Sorted Input",
      description:
        "Verifies QuickSort handles already-sorted input correctly (worst-case scenario for naive pivot)",
      type: "whitebox",
      input: "arr = [1, 2, 3, 4, 5]",
      expected_output: "arr = [1, 2, 3, 4, 5], comparisons count matches expected worst-case",
      code: `def test_quicksort_sorted_input():
    arr = [1, 2, 3, 4, 5]
    qs = QuickSort()
    result = qs.sort(arr.copy())
    
    assert result == [1, 2, 3, 4, 5]
    assert qs.get_comparisons() > 0`,
    },
  ],
  blackbox_tests: [
    {
      id: "bt-1",
      name: "Sort Random Array",
      description: "Sorting an unsorted array of integers should return elements in ascending order",
      type: "blackbox",
      input: "[38, 27, 43, 3, 9, 82, 10]",
      expected_output: "[3, 9, 10, 27, 38, 43, 82]",
    },
    {
      id: "bt-2",
      name: "Sort Empty Array",
      description: "Sorting an empty array should return an empty array without errors",
      type: "blackbox",
      input: "[]",
      expected_output: "[]",
    },
    {
      id: "bt-3",
      name: "Sort Single Element",
      description: "Sorting an array with one element should return the same array",
      type: "blackbox",
      input: "[42]",
      expected_output: "[42]",
    },
    {
      id: "bt-4",
      name: "Sort Array with Duplicates",
      description: "Sorting an array containing duplicate values should handle them correctly",
      type: "blackbox",
      input: "[5, 3, 5, 1, 3, 2, 1]",
      expected_output: "[1, 1, 2, 3, 3, 5, 5]",
    },
    {
      id: "bt-5",
      name: "Sort Reverse-Sorted Array",
      description: "Sorting an array that is in descending order should return ascending order",
      type: "blackbox",
      input: "[9, 7, 5, 3, 1]",
      expected_output: "[1, 3, 5, 7, 9]",
    },
  ],
  summary:
    "This codebase implements two classic comparison-based sorting algorithms: QuickSort and MergeSort. QuickSort uses the last element as pivot in its partition scheme, recursively dividing the array into two sub-arrays around the pivot. MergeSort follows the divide-and-conquer approach by recursively splitting the array into halves and merging them back in sorted order. Both classes implement a common Sortable interface and track the number of comparisons made during sorting. A SortUtils utility class provides shared helper methods including swap, isSorted, and printArray operations.",
  created_at: "2026-02-19T14:10:00Z",
};

export function getMockResult(projectId: string): AnalysisResult {
  const project = mockProjects.find((p) => p.id === projectId);
  if (project?.mode === "code-upload") return mockCodeResult;
  return mockStoryResult;
}
