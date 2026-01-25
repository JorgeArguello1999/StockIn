FROM python:3.13-slim

# Keep Python from buffering stdout and stderr and don't write bytecode
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies (curl for healthchecks if needed, usually good to have)
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user and group
RUN useradd -m -u 1000 stockin

# Install Gunicorn explicitly
RUN pip install gunicorn

# Copy requirements/project file and install dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir .

# Copy application code
COPY . .

# Change ownership of the application directory to the non-root user
RUN chown -R stockin:stockin /app

# Switch to non-root user
USER stockin

# Expose port
EXPOSE 5000

# Environment variables
ENV FLASK_APP=app.py

# Run with Gunicorn
# Workers: 2-4 recommended for typical loads (2 * cores + 1)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "app:app"]
