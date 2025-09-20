import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const usersCollectionRef = collection(db, 'users');
        const q = query(usersCollectionRef, where('role', '==', 'user')); // Fetch only users with 'user' role
        const querySnapshot = await getDocs(q);
        const studentsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStudents(studentsData);
      } catch (err) {
        console.error("Error fetching students: ", err);
        setError("Failed to load student data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  if (loading) {
    return <div className="text-center neon-subtext">Loading students...</div>;
  }

  if (error) {
    return <div className="alert alert-danger text-center">{error}</div>;
  }

  return (
    <div className="container mt-5">
      <h2 className="neon-text text-center mb-4">Registered Students</h2>
      {students.length === 0 ? (
        <div className="alert alert-info text-center">No students registered yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-dark table-striped table-hover neon-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Unique ID</th>
                <th>Branch</th>
                <th>Year</th>
                <th>Section</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.uniqueId}</td>
                  <td>{student.branch}</td>
                  <td>{student.year}</td>
                  <td>{student.section}</td>
                  <td>{student.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default StudentList;
