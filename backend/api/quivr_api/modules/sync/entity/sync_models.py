import hashlib
import io
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Optional
from uuid import UUID

from pydantic import BaseModel
from sqlmodel import (  # noqa: F811
    JSON,
    TIMESTAMP,
    Column,
    Field,
    Relationship,
    SQLModel,
    text,
)
from sqlmodel import UUID as PGUUID

from quivr_api.modules.sync.dto.outputs import SyncProvider, SyncsOutput
from quivr_api.modules.user.entity.user_identity import User


@dataclass
class DownloadedSyncFile:
    file_name: str
    extension: str
    file_data: io.BufferedReader

    def file_sha1(self) -> str:
        m = hashlib.sha1()
        self.file_data.seek(0)
        data = self.file_data.read()
        m.update(data)
        self.file_data.seek(0)
        return m.hexdigest()


class SyncFile(BaseModel):
    id: str
    name: str
    is_folder: bool
    last_modified: str
    mime_type: str
    web_view_link: str
    size: Optional[int] = None
    notification_id: UUID | None = None
    icon: Optional[str] = None
    parent_id: Optional[str] = None
    type: Optional[str] = None


class Syncs(SQLModel, table=True):
    __tablename__ = "syncs_user"  # type: ignore

    id: int | None = Field(default=None, primary_key=True)
    email: str | None = Field(default=None)
    user_id: UUID = Field(foreign_key="users.id", nullable=False)
    name: str
    provider: str
    credentials: Dict[str, str] | None = Field(
        default=None, sa_column=Column("credentials", JSON)
    )
    state: Dict[str, str] | None = Field(default=None, sa_column=Column("state", JSON))
    additional_data: dict | None = Field(
        default=None, sa_column=Column("additional_data", JSON)
    )

    def to_dto(self) -> SyncsOutput:
        assert self.id, "can't create create output if sync isn't inserted"
        return SyncsOutput(
            id=self.id,
            user_id=self.user_id,
            provider=SyncProvider(self.provider.lower()),
            credentials=self.credentials,
            state=self.state,
            additional_data=self.additional_data,
        )


class NotionSyncFile(SQLModel, table=True):
    """
    Represents a file synchronized with Notion.
    """

    __tablename__ = "notion_sync"  # type: ignore

    id: Optional[UUID] = Field(
        default=None,
        sa_column=Column(
            PGUUID,
            server_default=text("uuid_generate_v4()"),
            primary_key=True,
        ),
    )
    notion_id: UUID = Field(unique=True, description="The ID of the file in Notion")
    parent_id: UUID | None = Field(
        default=None, description="The ID of the parent file or directory"
    )
    name: str = Field(default=None, description="The name of the file")
    icon: Optional[str] = Field(description="The icon associated with the file")
    mime_type: str = Field(default=None, description="The MIME type of the file")
    web_view_link: str = Field(description="The web view link for the file")
    is_folder: bool = Field(description="Indicates if the file is a folder")
    last_modified: datetime = Field(
        sa_column=Column(TIMESTAMP(timezone=True)),
        description="The last modified timestamp of the file",
    )
    type: Optional[str] = Field(
        default=None, description="The type/category of the file"
    )
    user_id: UUID = Field(
        foreign_key="users.id",
        description="The ID of the user who owns the file",
    )
    user: User = Relationship(back_populates="notion_syncs")
