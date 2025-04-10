import { Student } from "@/lib/services/firebase/students";

interface LMSStudent {
  id: string;
  name: string;
  email: string;
  status: string;
  enrolledCourses: Array<{
    id: string;
    name: string;
    progress: number;
    startDate: string;
    endDate: string;
  }>;
}

interface LMSCourse {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  enrollmentCount: number;
  maxCapacity: number;
}

const API_BASE_URL = import.meta.env.VITE_LMS_API_URL;
const API_KEY = import.meta.env.VITE_LMS_API_KEY;

export const lmsService = {
  async getStudents(): Promise<LMSStudent[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/students`, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching LMS students:", error);
      throw error;
    }
  },

  async getCourses(): Promise<LMSCourse[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/courses`, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching LMS courses:", error);
      throw error;
    }
  },

  async syncStudent(student: Student): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/students/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(student),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error syncing student with LMS:", error);
      throw error;
    }
  },

  async getStudentProgress(studentId: string): Promise<
    {
      courseId: string;
      progress: number;
      lastActivity: string;
    }[]
  > {
    try {
      const response = await fetch(
        `${API_BASE_URL}/students/${studentId}/progress`,
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching student progress:", error);
      throw error;
    }
  },

  async enrollStudent(studentId: string, courseId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/enrollments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentId, courseId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error enrolling student:", error);
      throw error;
    }
  },
};
