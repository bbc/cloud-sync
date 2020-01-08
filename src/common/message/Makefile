SRC_DIR=src/ 
OBJ_DIR=build/
OUTPUT_DIR=bin/


SRCS = CloudSyncMessage.pb.cpp CloudSyncPacket.pb.cpp main.cpp
OBJS = CloudSyncMessage.pb.o CloudSyncPacket.pb.o main.o
CSRCS = $(addprefix $(SRC_DIR),$(SRCS))
COBJS = $(addprefix $(OBJ_DIR),$(OBJS))
APP = $(addprefix $(OUTPUT_DIR), testproto)

LIBS= 
CXX=clang++
LFLAGS=  -I/usr/local/include -L/usr/local/lib 
LIBFLAGS= -stdlib=libc++ -lprotobuf
CXXFLAGS= -Wall -g -c -std=c++11 -stdlib=libc++ -I/usr/local/include -O0 
RM=rm
x=src

.PHONY : all clean

all: proto

$(APP): $(COBJS)
	${CXX} ${LFLAGS} ${COBJS} ${LIBS} $(LIBFLAGS) -o $@

$(OBJ_DIR)%.o: $(x)/%.cpp
	${CXX} ${CXXFLAGS} $< -o $@

proto:
	protoc --proto_path=./ --js_out=import_style=commonjs,binary:./ CloudSyncMessage.proto  CloudSyncPacket.proto
	
clean:
	$(RM) ${COBJS}
	$(RM) ${APP}