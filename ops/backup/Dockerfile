FROM alpine:3.20

# pg_dump/pg_restore 16 (igual que el servidor), rclone para MinIO y para subir fuera.
RUN apk add --no-cache postgresql16-client rclone tzdata ca-certificates

COPY backup.sh /usr/local/bin/backup
# Por si el archivo se clonó con saltos de línea de Windows.
RUN sed -i 's/\r$//' /usr/local/bin/backup && chmod +x /usr/local/bin/backup

ENTRYPOINT ["backup"]
CMD ["daemon"]
