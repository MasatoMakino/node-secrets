# node-secrets

[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)
[![CI](https://github.com/MasatoMakino/node-secrets/actions/workflows/ci.yml/badge.svg)](https://github.com/MasatoMakino/node-secrets/actions/workflows/ci.yml)

> [!NOTE]  
> This package is designed to prevent the accidental push of private keys. However, for enhanced security, we strongly recommend using GitHub's [Secret scanning](<[https://docs.github.com/en/code-security/secret-scanning](https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning)>) feature. Please use this package primarily for technical experimentation purposes.

## How to use

```shell
npx @masatomakino/aws-secrets
```

This command scans files staged in the git repository for AWS key information.
