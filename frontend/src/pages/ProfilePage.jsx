import React, { useEffect, useState } from "react";
import "../index.css";

const fallbackUser = {
  name: "Juan Marcos Garcia",
  email: "juan.marcos@accenture.com",
  role: "Application / Cloud Support Associate",
  level: "CL6",
  capability: "Cloud / SRE",
  location: "Cebu City",
  team: "Cloud Operations",
  employeeId: "juan.m.garcia",
  skills: "Azure PaaS, Cloud Support, SRE",
  bio:
    "Cloud support professional working across application support, automation, and reliability engineering.",
};

export default function ProfilePage() {
  const [isEditing, setIsEditing] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState("");

  const [formData, setFormData] =
    useState(fallbackUser);

  const [originalFormData, setOriginalFormData] =
    useState(fallbackUser);

  /*
  |--------------------------------------------------------------------------
  | Load Demo User
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const storedUser =
      sessionStorage.getItem(
        "benchflow_user"
      );

    if (!storedUser) {
      return;
    }

    try {
      const parsedUser =
        JSON.parse(storedUser);

      const userData = {
        ...fallbackUser,

        name:
          parsedUser.name ||
          fallbackUser.name,

        email:
          parsedUser.email ||
          fallbackUser.email,

        role:
          parsedUser.role ||
          fallbackUser.role,
      };

      setFormData(userData);
      setOriginalFormData(userData);
    } catch (error) {
      console.error(
        "Unable to load profile:",
        error
      );
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Initials
  |--------------------------------------------------------------------------
  */

  const initials = formData.name
    ?.split(" ")
    .map((part) =>
      part.charAt(0)
    )
    .slice(0, 2)
    .join("")
    .toUpperCase();

  /*
  |--------------------------------------------------------------------------
  | Input
  |--------------------------------------------------------------------------
  */

  const handleInputChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setSaveMessage("");
  };

  /*
  |--------------------------------------------------------------------------
  | Edit
  |--------------------------------------------------------------------------
  */

  const startEditing = () => {
    setOriginalFormData({
      ...formData,
    });

    setSaveMessage("");
    setIsEditing(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Cancel
  |--------------------------------------------------------------------------
  */

  const cancelEditing = () => {
    setFormData(
      originalFormData
    );

    setSaveMessage("");
    setIsEditing(false);
  };

  /*
  |--------------------------------------------------------------------------
  | Save
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setIsSaving(true);
    setSaveMessage("");

    try {
      /*
      ==============================================================
      FUTURE BACKEND PROFILE UPDATE
      ==============================================================

      const response =
        await fetch(
          "/api/profile",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials: "include",

            body: JSON.stringify(
              formData
            ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to update profile."
        );
      }

      ==============================================================
      */

      /*
      ==============================================================
      TEMPORARY MOCK SAVE
      ==============================================================
      */

      await new Promise(
        (resolve) => {
          window.setTimeout(
            resolve,
            500
          );
        }
      );

      const existingUser =
        sessionStorage.getItem(
          "benchflow_user"
        );

      const sessionUser =
        existingUser
          ? JSON.parse(existingUser)
          : {};

      sessionStorage.setItem(
        "benchflow_user",
        JSON.stringify({
          ...sessionUser,

          name: formData.name,
          email: formData.email,
          role: formData.role,
        })
      );

      setOriginalFormData({
        ...formData,
      });

      setIsEditing(false);

      setSaveMessage(
        "Profile updated successfully."
      );
    } catch (error) {
      console.error(
        "Profile update failed:",
        error
      );

      setSaveMessage(
        "Unable to update profile."
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Skills
  |--------------------------------------------------------------------------
  */

  const skills =
    formData.skills
      .split(",")
      .map((skill) =>
        skill.trim()
      )
      .filter(Boolean);

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <main className="profile-page">

      {/* ================= HERO ================= */}

      <section className="profile-hero">
        <div>
          <h1>PROFILE</h1>

          <p>
            Manage your BenchFlow
            profile, skills,
            capability, and work
            information.
          </p>
        </div>
      </section>

      {/* ================= PROFILE HEADER ================= */}

      <section className="profile-summary-card">
        <div className="profile-identity">

          <div className="profile-avatar">
            {initials || "BF"}
          </div>

          <div className="profile-identity-text">

            <div className="profile-name-row">
              <h2>
                {formData.name}
              </h2>

              <span className="profile-status">
                Active
              </span>
            </div>

            <p>
              {formData.email}
            </p>

            <div className="profile-tags">
              <span>
                {formData.level}
              </span>

              <span>
                {formData.capability}
              </span>

              <span>
                {formData.location}
              </span>
            </div>

          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            className="profile-edit-button"
            onClick={startEditing}
          >
            Edit Profile
          </button>
        )}
      </section>

      {/* ================= CONTENT ================= */}

      <form
        className="profile-content"
        onSubmit={handleSubmit}
      >

        {/* ================= LEFT ================= */}

        <div className="profile-main-column">

          {/* PERSONAL */}

          <section className="profile-card">
            <div className="profile-card-header">

              <span className="profile-eyebrow">
                PERSONAL INFORMATION
              </span>

              <h3>
                Profile details
              </h3>

              <p>
                Your basic BenchFlow
                account information.
              </p>

            </div>

            <div className="profile-fields">

              <div className="profile-field">
                <label htmlFor="name">
                  Full Name
                </label>

                <input
                  id="name"
                  name="name"
                  value={
                    formData.name
                  }
                  onChange={
                    handleInputChange
                  }
                  disabled={
                    !isEditing
                  }
                />
              </div>

              <div className="profile-field">
                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={
                    formData.email
                  }
                  onChange={
                    handleInputChange
                  }
                  disabled={
                    !isEditing
                  }
                />
              </div>

              <div className="profile-field">
                <label htmlFor="employeeId">
                  Employee ID
                </label>

                <input
                  id="employeeId"
                  name="employeeId"
                  value={
                    formData.employeeId
                  }
                  onChange={
                    handleInputChange
                  }
                  disabled={
                    !isEditing
                  }
                />
              </div>

              <div className="profile-field">
                <label htmlFor="location">
                  Location
                </label>

                <input
                  id="location"
                  name="location"
                  value={
                    formData.location
                  }
                  onChange={
                    handleInputChange
                  }
                  disabled={
                    !isEditing
                  }
                />
      </div>

            </div>
          </section>

          {/* ================= WORK INFORMATION ================= */}

          <section className="profile-card">
            <div className="profile-card-header">

              <span className="profile-eyebrow">
                WORK INFORMATION
              </span>

              <h3>
                Role & capability
              </h3>

              <p>
                Your current role and
                organizational details.
              </p>

            </div>

            <div className="profile-fields">

              <div className="profile-field">
                <label htmlFor="role">
                  Role
                </label>

                <input
                  id="role"
                  name="role"
                  value={
                    formData.role
                  }
                  onChange={
                    handleInputChange
                  }
                  disabled={
                    !isEditing
                  }
                />
              </div>

              <div className="profile-field">
                <label htmlFor="level">
                  Career Level
                </label>

                <input
                  id="level"
                  name="level"
                  value={
                    formData.level
                  }
                  onChange={
                    handleInputChange
                  }
                  disabled={
                    !isEditing
                  }
                />
              </div>

              <div className="profile-field">
                <label htmlFor="capability">
                  Capability
                </label>

                <input
                  id="capability"
                  name="capability"
                  value={
                    formData.capability
                  }
                  onChange={
                    handleInputChange
                  }
                  disabled={
                    !isEditing
                  }
                />
              </div>

              <div className="profile-field">
                <label htmlFor="team">
                  Team
                </label>

                <input
                  id="team"
                  name="team"
                  value={
                    formData.team
                  }
                  onChange={
                    handleInputChange
                  }
                  disabled={
                    !isEditing
                  }
                />
              </div>

            </div>
          </section>

          {/* ================= ABOUT ================= */}

          <section className="profile-card">

            <div className="profile-card-header">
              <span className="profile-eyebrow">
                ABOUT
              </span>

              <h3>
                Professional summary
              </h3>

              <p>
                Add a short description
                about your experience and
                focus areas.
              </p>
            </div>

            <div className="profile-field">

              <label htmlFor="bio">
                About Me
              </label>

              <textarea
                id="bio"
                name="bio"
                value={
                  formData.bio
                }
                onChange={
                  handleInputChange
                }
                disabled={
                  !isEditing
                }
                maxLength={500}
              />

              {isEditing && (
                <span className="profile-character-count">
                  {
                    formData.bio
                      .length
                  }
                  /500
                </span>
              )}

            </div>
          </section>

        </div>

        {/* ================= RIGHT SIDE ================= */}

        <aside className="profile-side-column">

          {/* ================= COMPLETION ================= */}

          <section className="profile-card profile-completion-card">

            <span className="profile-eyebrow">
              PROFILE STATUS
            </span>

            <div className="completion-heading">

              <div>
                <h3>
                  Profile completion
                </h3>

                <p>
                  Keep your BenchFlow
                  profile current.
                </p>
              </div>

              <strong>
                85%
              </strong>

            </div>

            <div className="completion-track">
              <div
                className="completion-fill"
                style={{
                  width: "85%",
                }}
              />
            </div>

            <div className="completion-list">

              <div>
                <span className="completion-check">
                  ✓
                </span>

                Personal information
              </div>

              <div>
                <span className="completion-check">
                  ✓
                </span>

                Work information
              </div>

              <div>
                <span className="completion-check">
                  ✓
                </span>

                Capability
              </div>

              <div>
                <span className="completion-pending">
                  •
                </span>

                Add more skills
              </div>

            </div>
          </section>

          {/* ================= SKILLS ================= */}

          <section className="profile-card">

            <span className="profile-eyebrow">
              SKILLS
            </span>

            <h3>
              Skills & expertise
            </h3>

            <p className="profile-section-description">
              Help BenchFlow understand
              your current areas of
              expertise.
            </p>

            <div className="profile-field profile-skills-field">

              <label htmlFor="skills">
                Skills
              </label>

              <textarea
                id="skills"
                name="skills"
                value={
                  formData.skills
                }
                onChange={
                  handleInputChange
                }
                disabled={
                  !isEditing
                }
                placeholder="Azure, React, SRE..."
              />

            </div>

            <div className="profile-skill-list">

              {skills.map(
                (skill) => (
                  <span
                    key={skill}
                  >
                    {skill}
                  </span>
                )
              )}

            </div>

          </section>

        </aside>

        {/* ================= SAVE ACTIONS ================= */}

        {isEditing && (
          <div className="profile-form-actions">

            <button
              type="button"
              className="profile-cancel-button"
              onClick={
                cancelEditing
              }
              disabled={
                isSaving
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="profile-save-button"
              disabled={
                isSaving
              }
            >
              {isSaving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>
        )}

        {/* ================= STATUS ================= */}

        {saveMessage && (
          <div
            className="profile-save-message"
            role="status"
          >
            {saveMessage}
          </div>
        )}

      </form>
    </main>
  );
}