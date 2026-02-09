#!/bin/bash
#
# Alpha-Term Installer
# Usage: curl -sL https://neonalpha.me/install | bash
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO="dougfour/alpha-term"
INSTALL_DIR="${HOME}/.local/bin"
BINARY_NAME="alpha-term"
GITHUB_API="https://api.github.com/repos/${REPO}/releases/latest"

# Detect OS and architecture
detect_os() {
    case "$(uname -s)" in
        Darwin*) echo "macos" ;;
        Linux*) echo "linux" ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        *) echo "linux" ;; # Default to linux
    esac
}

detect_arch() {
    case "$(uname -m)" in
        x86_64|amd64) echo "x64" ;;
        aarch64|arm64) echo "arm64" ;;
        *) echo "x64" ;; # Default to x64
    esac
}

# Get latest version from GitHub
get_latest_version() {
    curl -sL "${GITHUB_API}" | grep -o '"tag_name": *"[^"]*"' | cut -d'"' -f4 | sed 's/v//'
}

# Download and install binary
install_binary() {
    local os=$1
    local arch=$2
    local version=$3
    
    local binary_url="https://github.com/${REPO}/releases/download/v${version}/${BINARY_NAME}-${os}-${arch}"
    local install_path="${INSTALL_DIR}/${BINARY_NAME}"
    
    echo -e "${YELLOW}Downloading Alpha-Term v${version} for ${os}-${arch}...${NC}"
    
    # Create install directory if it doesn't exist
    mkdir -p "${INSTALL_DIR}"
    
    # Download binary (-f = fail on HTTP errors, --connect-timeout/--max-time prevent hanging)
    if curl -fL --progress-bar --connect-timeout 15 --max-time 120 "${binary_url}" -o "${install_path}"; then
        chmod +x "${install_path}"
        echo -e "${GREEN}✓ Installed to ${install_path}${NC}"
        
        # Check if INSTALL_DIR is in PATH
        if [[ ":${PATH}:" != *":${INSTALL_DIR}:"* ]]; then
            echo -e "${YELLOW}⚠️  ${INSTALL_DIR} is not in your PATH${NC}"
            echo "Add this to your shell profile (.bashrc or .zshrc):"
            echo "  export PATH=\"${INSTALL_DIR}:\$PATH\""
        else
            echo -e "${GREEN}✓ ${INSTALL_DIR} is in your PATH${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}✅ Alpha-Term v${version} installed successfully!${NC}"
        echo ""
        echo "Run 'alpha-term --version' to verify."
    else
        echo -e "${RED}❌ Failed to download binary${NC}"
        echo "URL: ${binary_url}"
        exit 1
    fi
}

# Main execution
main() {
    echo ""
    echo -e "${GREEN}Alpha-Term Installer${NC}"
    echo "======================"
    echo ""
    
    # Get latest version
    echo -e "${YELLOW}Checking for latest version...${NC}"
    local latest_version
    latest_version=$(get_latest_version)
    
    if [[ -z "${latest_version}" ]]; then
        echo -e "${RED}❌ Could not fetch latest version${NC}"
        echo "Please check your internet connection or try again later."
        exit 1
    fi
    
    echo -e "${GREEN}Latest version: v${latest_version}${NC}"
    echo ""
    
    # Detect platform
    local os
    local arch
    os=$(detect_os)
    arch=$(detect_arch)
    
    echo "Detected: ${os}-${arch}"
    echo ""
    
    # Install
    install_binary "${os}" "${arch}" "${latest_version}"
}

main "$@"
