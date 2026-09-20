import { useState } from "react";
import { useRequests } from "../context/RequestContext";
import { useAuth } from "../context/AuthContext";

export default function EngineerRequests() {
  const {
    requests,
    documents,
    decide,
    deleteRequest,
  } = useRequests();

  const { users } = useAuth();

  const [search, setSearch] =
    useState("");

  const [note, setNote] =
    useState("");

  const [selected, setSelected] =
    useState(null);

  const [deletingId, setDeletingId] =
    useState("");

  const list = requests.filter(
    (request) =>
      String(
        request.association || ""
      )
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
  );

  const clientFor = (id) =>
    users.find(
      (user) => user.id === id
    );

  const setDecision = (
    request,
    status
  ) => {
    if (
      ![
        "Submitted",
        "Under Review",
      ].includes(request.status)
    ) {
      return;
    }

    if (
      status ===
      "Documents Pending"
    ) {
      setSelected(request);
      setNote("");
      return;
    }

    if (
      window.confirm(
        `Set this request as ${status}?`
      )
    ) {
      decide(
        request.id,
        status
      );
    }
  };

  const confirmPending = () => {
    if (!note.trim()) {
      alert(
        "An internal note is required."
      );
      return;
    }

    decide(
      selected.id,
      "Documents Pending",
      note.trim()
    );

    setSelected(null);
  };

  const removeRequest = async (
    request
  ) => {
    const confirmed =
      window.confirm(
        `Delete the submitted request from ${request.association || "this client"}? This will also remove all documents attached to this request.`
      );

    if (!confirmed) return;

    try {
      setDeletingId(request.id);

      await deleteRequest(
        request.id
      );

      alert(
        "Request deleted successfully."
      );
    } catch (error) {
      alert(
        error?.message ||
          "The request could not be deleted."
      );
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="container page-container">
      <div className="page-header">
        <span className="eyebrow">
          REQUEST MANAGEMENT
        </span>

        <h1>
          Client requests
        </h1>

        <p>
          Review requests and record
          the next decision.
        </p>
      </div>

      <input
        className="search-input wide-search"
        placeholder="Search association..."
        value={search}
        onChange={(event) =>
          setSearch(
            event.target.value
          )
        }
      />

      <div className="request-list">
        {list.map(
          (request) => {
            const client =
              clientFor(
                request.clientId
              );

            const docs =
              documents.filter(
                (document) =>
                  document.requestId ===
                  request.id
              );

            return (
              <div
                className="card request-review"
                key={request.id}
              >
                <div className="request-top">
                  <div>
                    <h3>
                      {request.association}
                    </h3>

                    <p>
                      {request.details}
                    </p>

                    <small>
                      Client:{" "}
                      {client?.name ||
                        "Unknown"}{" "}
                      ·{" "}
                      {client?.email ||
                        ""}
                    </small>
                  </div>

                  <span
                    className={`status ${String(
                      request.status
                    )
                      .toLowerCase()
                      .replaceAll(
                        " ",
                        "-"
                      )}`}
                  >
                    {request.status}
                  </span>
                </div>

                {docs.length > 0 && (
                  <div className="file-list">
                    {docs.map(
                      (
                        document
                      ) => (
                        <span
                          key={
                            document.id
                          }
                        >
                          📄{" "}
                          {
                            document.fileName
                          }
                        </span>
                      )
                    )}
                  </div>
                )}

                {[
                  "Submitted",
                  "Under Review",
                ].includes(
                  request.status
                ) && (
                  <div className="decision-actions">
                    <button
                      className="primary-btn"
                      onClick={() =>
                        setDecision(
                          request,
                          "Approved"
                        )
                      }
                    >
                      Approve
                    </button>

                    <button
                      className="danger-btn"
                      onClick={() =>
                        setDecision(
                          request,
                          "Rejected"
                        )
                      }
                    >
                      Reject
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={() =>
                        setDecision(
                          request,
                          "Documents Pending"
                        )
                      }
                    >
                      Documents Pending
                    </button>
                  </div>
                )}

                <div className="engineer-request-footer">
                  <div className="locked-note">
                    Current status:{" "}
                    {request.status}.
                    {request.notes &&
                      ` Note: ${request.notes}`}
                  </div>

                  <button
                    type="button"
                    className="danger-btn small"
                    onClick={() =>
                      removeRequest(
                        request
                      )
                    }
                    disabled={
                      deletingId ===
                      request.id
                    }
                  >
                    {deletingId ===
                    request.id
                      ? "Deleting..."
                      : "Delete Request"}
                  </button>
                </div>
              </div>
            );
          }
        )}

        {list.length === 0 && (
          <div className="empty-state">
            No requests found.
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-backdrop">
          <div className="modal card">
            <h2>
              Request additional
              documents
            </h2>

            <p>
              Add an internal note
              explaining what the
              client needs to provide.
            </p>

            <textarea
              rows="5"
              value={note}
              onChange={(event) =>
                setNote(
                  event.target.value
                )
              }
              placeholder="Internal note..."
            />

            <div className="form-actions">
              <button
                className="secondary-btn"
                onClick={() =>
                  setSelected(null)
                }
              >
                Cancel
              </button>

              <button
                className="primary-btn"
                onClick={
                  confirmPending
                }
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}