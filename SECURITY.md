# Security Policy

ManUp stores and serves secrets. Vulnerabilities here are treated as high priority.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, report privately using one of:

- [GitHub Security Advisories](https://github.com/Amanbig/ManUp/security/advisories/new) for this repository (preferred — keeps the report and any discussion private until a fix ships).
- Email **amanpreetsinghjhiwant@outlook.com** with a description of the issue, steps to reproduce, and any relevant logs or PoC code.

Please include:

- The ManUp version or Docker image tag affected.
- Whether the issue requires authentication, a specific role, or a specific `DB_TYPE`/deployment configuration to reproduce.
- Potential impact (e.g. secret disclosure, privilege escalation, auth bypass).

We aim to acknowledge reports within 72 hours and to provide a remediation timeline once the issue is confirmed. Please give us a reasonable window to ship a fix before any public disclosure.

## Supported Versions

ManUp is pre-1.0 and evolving quickly. Only the latest released version (`latest` Docker tag / most recent `vX.Y.Z` git tag) receives security fixes; older versions are not backported.

| Version         | Supported |
| --------------- | --------- |
| Latest release  | ✅        |
| Older releases  | ❌        |

## Scope

In scope: authentication and session handling, RBAC/authorization checks, secret encryption at rest and in transit, API key issuance/validation, and anything in `server/src`. Out of scope: vulnerabilities requiring physical access to the host, or issues in third-party dependencies that should be reported upstream (though we'd still like to know — feel free to flag them).
