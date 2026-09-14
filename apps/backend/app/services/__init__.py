"""Business-logic service package.

Service modules intentionally stay lazy. Importing one lightweight service
(for example the offline job radar) must not initialize document parsing,
ONNX detection, or the LLM client. Callers import functions from their owning
module, such as ``app.services.parser`` or ``app.services.improver``.
"""

__all__ = [
    "ats",
    "cover_letter",
    "improver",
    "interview_prep",
    "job_radar",
    "parser",
    "refiner",
    "resume_preservation",
    "resume_wizard",
]
