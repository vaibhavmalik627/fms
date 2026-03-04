import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import { buildUploadsImageUrl } from "../utils/image";

function FacultyDetailsPage({ facultyId }) {
  const { id } = useParams();
  const resolvedId = facultyId || id;
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const { data } = await api.get(`/faculty/${resolvedId}`);
        setFaculty(data);
        setImageFailed(false);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load faculty");
      } finally {
        setLoading(false);
      }
    };
    fetchFaculty();
  }, [resolvedId]);

  if (loading) return <section className="card">Loading...</section>;
  if (error) return <section className="card error">{error}</section>;
  if (!faculty) return <section className="card">Faculty record not found.</section>;

  const imageUrl = buildUploadsImageUrl(faculty.profileImage);

  return (
    <section className="card">
      <div className="row between">
        <h1>{faculty.name}</h1>
        {!facultyId && (
          <Link className="btn muted" to="/faculty">
            Back
          </Link>
        )}
      </div>

      {imageUrl && !imageFailed ? (
        <div className="image-wrap">
          <img
            src={imageUrl}
            alt={faculty.name}
            onError={() => setImageFailed(true)}
          />
        </div>
      ) : (
        <div className="image-wrap">
          <div className="details-photo-placeholder">{(faculty.name || "U").slice(0, 1).toUpperCase()}</div>
        </div>
      )}

      <div className="details-grid">
        <p>
          <strong>Subject:</strong> {faculty.subject}
        </p>
        <p>
          <strong>Department:</strong> {faculty.department}
        </p>
        <p>
          <strong>Email:</strong> {faculty.email || "-"}
        </p>
        <p>
          <strong>Phone:</strong> {faculty.phone || "-"}
        </p>
        <p>
          <strong>Qualification:</strong> {faculty.qualification || "-"}
        </p>
        <p>
          <strong>Experience:</strong> {faculty.experience ?? "-"}
        </p>
        <p>
          <strong>Joining Date:</strong>{" "}
          {faculty.joiningDate ? new Date(faculty.joiningDate).toLocaleDateString() : "-"}
        </p>
        <p>
          <strong>Status:</strong> {faculty.status}
        </p>
      </div>
    </section>
  );
}

export default FacultyDetailsPage;
